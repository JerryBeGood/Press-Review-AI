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
} from "../_shared/utils.ts";
import { sourceEvaluation, contentExtraction } from "../_shared/prompts.ts";
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

    // eslint-disable-next-line no-console
    console.log(`Processing ${queries.length} queries for topic: "${topic}" with schedule: ${schedule}`);

    const startPublishedDate = calculateStartPublishedDate(schedule);
    const endPublishedDate = new Date().toISOString();

    // eslint-disable-next-line no-console
    console.log(`Searching for sources published after: ${startPublishedDate}`);

    // TODO: Exa has rate limit of 5 request per second. We need to handle this.
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
        // eslint-disable-next-line no-console
        console.log(`Searching for: "${query}"`);

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

          // eslint-disable-next-line no-console
          console.log(`Found ${searchResponse.results.length} results for query: "${query}"`);
          return result;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error searching for query "${query}":`, error);
          return { query, results: [] };
        }
      },
      1
    ).then((results) => {
      allSearchResults.push(...results);
    });

    // eslint-disable-next-line no-console
    console.log(`Total search results collected: ${allSearchResults.reduce((sum, r) => sum + r.results.length, 0)}`);

    const openai = createOpenAIClient();
    const sourceScores = new Map<string, number>(); // Store relevance scores by URL

    const evaluationSchema = z.object({
      score: z
        .number()
        .int()
        .min(0)
        .max(10)
        .describe("Relevance score from 1-10 based on persona alignment, information density, and novelty"),
      reasoning: z.string().describe("Detailed explanation covering all three evaluation criteria"),
    });

    const sourcesToEvaluate = allSearchResults
      .flatMap((searchResult) => searchResult.results)
      .filter((source) => !sourceScores.has(source.url));

    await processConcurrently(
      sourcesToEvaluate,
      async (source) => {
        try {
          // eslint-disable-next-line no-console
          console.log(`Evaluating source: ${source.title}`);

          const evaluation = await generateObject({
            model: openai.model("gpt-4o-mini"),
            schema: evaluationSchema,
            prompt: sourceEvaluation(topic, source, {
              persona: generationContext.persona,
              goal: generationContext.goal,
              audience: generationContext.audience,
            }),
          });

          const score = evaluation.object.score;
          sourceScores.set(source.url, score);

          // Threshold for passing the evaluation
          if (score >= EVALUATION_THRESHOLD) {
            // console.log(`✓ Relevant (${score}/10): ${source.title} - ${evaluation.object.reasoning}`);
          } else {
            // eslint-disable-next-line no-console
            console.log(`✗ Rejected (${score}/10): ${source.title} - ${evaluation.object.reasoning}`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error evaluating source ${source.url}:`, error);
          // Mark with score 0 if evaluation fails
          sourceScores.set(source.url, 0);
        }
      },
      3
    ).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error during source evaluation:", error);
    });

    const passedSources = Array.from(sourceScores.entries()).filter(
      ([, score]) => score >= EVALUATION_THRESHOLD
    ).length;
    const rejectedSources = sourceScores.size - passedSources;

    // eslint-disable-next-line no-console
    console.log(`Evaluation complete: ${passedSources} passed, ${rejectedSources} rejected`);

    const researchResults: ResearchArticle[] = [];

    const extractionSchema = z.object({
      main_event: z.string().describe("Specific description of what happened"),
      quantitative_data: z
        .array(z.string())
        .optional()
        .describe("Numbers, dates, prices (optional - do not hallucinate)"),
      quotes: z.array(z.string()).describe("Direct citations with speaker attribution"),
      opinions: z.array(z.string()).describe("High priority: Interesting perspectives or controversies"),
      unique_angle: z.string().describe("Value proposition vs. general knowledge"),
    });

    const relevantSourcesArray = allSearchResults
      .flatMap((searchResult) => searchResult.results)
      .filter((source) => {
        const score = sourceScores.get(source.url);
        return score !== undefined && score >= EVALUATION_THRESHOLD;
      });

    // Extract content from relevant sources concurrently with a limit of 2 (to avoid rate limiting)
    const extractedArticles = await processConcurrently(
      relevantSourcesArray,
      async (source) => {
        try {
          // eslint-disable-next-line no-console
          console.log(`Extracting content from: ${source.title}`);

          const extraction = await generateObject({
            model: openai.model("gpt-4o-mini"),
            schema: extractionSchema,
            prompt: contentExtraction(topic, source, {
              persona: generationContext.persona,
              goal: generationContext.goal,
              audience: generationContext.audience,
            }),
          });

          const relevanceScore = sourceScores.get(source.url) || 0;

          const article: ResearchArticle = {
            title: source.title,
            url: source.url,
            author: source.author,
            publishedDate: source.publishedDate,
            main_event: extraction.object.main_event,
            quantitative_data: extraction.object.quantitative_data || [],
            quotes: extraction.object.quotes,
            opinions: extraction.object.opinions,
            unique_angle: extraction.object.unique_angle,
            relevance_score: relevanceScore,
          };

          // eslint-disable-next-line no-console
          console.log(
            `✓ Extracted from "${source.title}" (score: ${relevanceScore}): ${extraction.object.quotes.length} quotes, ${extraction.object.opinions.length} opinions`
          );

          return article;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error extracting content from ${source.url}:`, error);
          return null;
        }
      },
      2
    ).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error during content extraction:", error);
      return [];
    });

    researchResults.push(...(extractedArticles.filter((article) => article !== null) as ResearchArticle[]));

    // eslint-disable-next-line no-console
    console.log(`Content extraction complete: ${researchResults.length} articles processed`);

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

    // eslint-disable-next-line no-console
    console.log(`Research results saved successfully to database`);

    // Invoke the next function in the chain: synthesize-content
    await invokeEdgeFunction("synthesize-content", {
      generated_press_review_id,
    });

    return successResponse("Research completed successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in execute-research:", error);

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
