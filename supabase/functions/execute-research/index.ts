import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import {
  updateGenerationStatus,
  errorResponse,
  successResponse,
  calculateStartPublishedDate,
  invokeEdgeFunction,
  processConcurrently,
  verifyAuth,
  createLogger,
} from "../_shared/utils.ts";
import { evaluateAndExtractSource } from "../_shared/prompts.ts";
import type { EdgeFunctionRequest, ResearchArticle, GenerationContext } from "../_shared/types.ts";
import { createExaClient, createOpenAIClient } from "../_shared/ai-clients.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SEARCH_RESULTS_LIMIT, EVALUATION_THRESHOLD } from "../_shared/config.ts";

serve(async (req: Request) => {
  // Verify authentication
  const authError = verifyAuth(req);
  if (authError) {
    return authError;
  }

  const supabase = createSupabaseClient();
  const { generated_press_review_id }: EdgeFunctionRequest = await req.json();

  if (!generated_press_review_id) {
    return errorResponse("Missing generated_press_review_id", 400);
  }

  const logger = createLogger(generated_press_review_id);

  try {
    await updateGenerationStatus(supabase, generated_press_review_id, "researching_sources");

    const { data: generatedReview, error: fetchError } = await supabase
      .from("generated_press_reviews")
      .select(
        `
        generated_queries,
        generation_context,
        press_reviews!inner (
          topic,
          schedule
        )
      `
      )
      .eq("id", generated_press_review_id)
      .single();

    if (fetchError || !generatedReview) {
      throw new Error(`Failed to fetch generated review: ${fetchError?.message || "Not found"}`);
    }

    const queries = generatedReview.generated_queries as string[];
    const generationContext = generatedReview.generation_context as GenerationContext;
    const { topic, schedule } = generatedReview.press_reviews as { topic: string; schedule: string };

    if (!generationContext) {
      throw new Error("Generation context not found - required for intelligent analysis");
    }

    if (!queries || queries.length === 0) {
      throw new Error("No generated queries found");
    }

    logger.log(`Processing ${queries.length} queries for topic: "${topic}" with schedule: ${schedule}`);

    const startPublishedDate = calculateStartPublishedDate(schedule);
    const endPublishedDate = new Date().toISOString();

    logger.log(`Searching for sources published after: ${startPublishedDate}`);

    const exa = createExaClient();
    const allSearchResults: {
      query: string;
      results: {
        title: string;
        url: string;
        publishedDate?: string;
        author?: string;
        text?: string;
      }[];
    }[] = [];

    await processConcurrently(
      queries,
      async (query) => {
        logger.log(`Searching for: "${query}"`);

        try {
          const searchResponse = await exa.searchAndContents(query, {
            numResults: SEARCH_RESULTS_LIMIT,
            startPublishedDate,
            endPublishedDate,
            type: "auto",
            moderation: true,
            text: true,
          });

          const result = {
            query,
            results: searchResponse.results.map((result) => ({
              title: result.title,
              url: result.url,
              publishedDate: result.publishedDate,
              author: result.author,
              text: result.text,
            })),
          };

          logger.log(`Found ${searchResponse.results.length} results for query: "${query}"`);
          return result;
        } catch (error) {
          logger.error(`Error searching for query "${query}":`, error);
          return { query, results: [] };
        }
      },
      2
    ).then((results) => {
      allSearchResults.push(...results);
    });

    logger.log(`Total search results collected: ${allSearchResults.reduce((sum, r) => sum + r.results.length, 0)}`);

    const openai = createOpenAIClient();
    const researchResults: ResearchArticle[] = [];

    // Unified schema for evaluation + extraction
    const evaluationExtractionSchema = z.object({
      score: z
        .number()
        .int()
        .min(0)
        .max(10)
        .describe("Relevance score from 1-10 based on persona alignment, information density, and novelty"),
      reasoning: z.string().describe("Detailed explanation covering all three evaluation criteria"),
      main_event: z.string().describe("Specific description of what happened"),
      quantitative_data: z
        .array(z.string())
        .optional()
        .describe("Numbers, dates, prices (optional - do not hallucinate)"),
      quotes: z.array(z.string()).describe("Direct citations with speaker attribution"),
      opinions: z.array(z.string()).describe("High priority: Interesting perspectives or controversies"),
      unique_angle: z.string().describe("Value proposition vs. general knowledge"),
    });

    // Deduplicate sources by URL before processing
    const allSourcesToProcess = allSearchResults
      .flatMap((searchResult) => searchResult.results)
      .filter((source, index, self) => index === self.findIndex((s) => s.url === source.url));

    logger.log(`Processing ${allSourcesToProcess.length} unique sources (deduplicated by URL)`);

    // Process all sources with unified evaluation + extraction
    const processedArticles = await processConcurrently(
      allSourcesToProcess,
      async (source) => {
        try {
          logger.log(`Processing: ${source.title}`);

          const result = await generateObject({
            model: openai.model("gpt-4o-mini"),
            schema: evaluationExtractionSchema,
            prompt: evaluateAndExtractSource(topic, source, {
              persona: generationContext.persona,
              goal: generationContext.goal,
              audience: generationContext.audience,
            }),
          });

          const { score, reasoning, ...extractedContent } = result.object;

          // Filter by threshold
          if (score < EVALUATION_THRESHOLD) {
            logger.log(`✗ Rejected (${score}/10): ${source.title} - ${reasoning}`);
            return null;
          }

          logger.log(`✓ Accepted (${score}/10): ${source.title}`);

          const article: ResearchArticle = {
            title: source.title,
            url: source.url,
            author: source.author,
            publishedDate: source.publishedDate,
            main_event: extractedContent.main_event,
            quantitative_data: extractedContent.quantitative_data || [],
            quotes: extractedContent.quotes,
            opinions: extractedContent.opinions,
            unique_angle: extractedContent.unique_angle,
            relevance_score: score,
          };

          return article;
        } catch (error) {
          logger.error(`Error processing ${source.url}:`, error);
          return null;
        }
      },
      5 // Increased concurrency since we're doing fewer total calls
    ).catch((error) => {
      logger.error("Error during source processing:", error);
      return [];
    });

    researchResults.push(...processedArticles.filter((article): article is ResearchArticle => article !== null));

    const passedSources = researchResults.length;
    const rejectedSources = allSourcesToProcess.length - passedSources;

    logger.log(`Processing complete: ${passedSources} accepted, ${rejectedSources} rejected`);

    // Step 3d: Save the research_results to database
    const { error: saveError } = await supabase
      .from("generated_press_reviews")
      .update({
        research_results: researchResults,
      })
      .eq("id", generated_press_review_id);

    if (saveError) {
      throw new Error(`Failed to save research results: ${saveError.message}`);
    }

    logger.log(`Research results saved successfully to database`);

    // Invoke the next function in the chain: synthesize-content
    await invokeEdgeFunction("synthesize-content", {
      generated_press_review_id,
    });

    return successResponse("Research completed successfully");
  } catch (error) {
    logger.error("Error in execute-research:", error);

    if (generated_press_review_id) {
      await updateGenerationStatus(
        supabase,
        generated_press_review_id,
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return errorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
