import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import {
  updateGenerationStatus,
  errorResponse,
  successResponse,
  calculateStartPublishedDate,
  invokeEdgeFunction,
} from "../_shared/utils.ts";
import { sourceEvaluation, contentExtraction } from "../_shared/prompts.ts";
import type { EdgeFunctionRequest, ResearchArticle } from "../_shared/types.ts";
import { createExaClient, createOpenAIClient } from "../_shared/ai-clients.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

serve(async (req: Request) => {
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
    const { topic, schedule } = generatedReview.press_reviews as { topic: string; schedule: string };

    if (!queries || queries.length === 0) {
      throw new Error("No generated queries found");
    }

    // eslint-disable-next-line no-console
    console.log(`Processing ${queries.length} queries for topic: "${topic}" with schedule: ${schedule}`);

    const startPublishedDate = calculateStartPublishedDate(schedule);
    const endPublishedDate = new Date().toISOString();

    // eslint-disable-next-line no-console
    console.log(`Searching for sources published after: ${startPublishedDate}`);

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

    for (const query of queries) {
      // eslint-disable-next-line no-console
      console.log(`Searching for: "${query}"`);

      try {
        const searchResponse = await exa.searchAndContents(query, {
          numResults: 5,
          startPublishedDate,
          endPublishedDate,
          type: "auto",
          moderation: true,
          text: true,
        });

        allSearchResults.push({
          query,
          results: searchResponse.results.map((result) => ({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate,
            author: result.author,
            text: result.text,
          })),
        });

        // eslint-disable-next-line no-console
        console.log(`Found ${searchResponse.results.length} results for query: "${query}"`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error searching for query "${query}":`, error);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Total search results collected: ${allSearchResults.reduce((sum, r) => sum + r.results.length, 0)}`);

    const openai = createOpenAIClient();
    const relevantSources = new Set<string>();
    const irrelevantSources = new Set<string>();

    const evaluationSchema = z.object({
      isRelevant: z.boolean().describe("Whether the source is objective, credible, and relevant to the topic"),
      reasoning: z.string().describe("Brief explanation of the evaluation decision"),
    });

    for (const searchResult of allSearchResults) {
      for (const source of searchResult.results) {
        if (relevantSources.has(source.url) || irrelevantSources.has(source.url)) {
          // eslint-disable-next-line no-console
          console.log(`Skipping already processed source: ${source.url}`);
          continue;
        }

        try {
          // eslint-disable-next-line no-console
          console.log(`Evaluating source: ${source.title}`);

          const evaluation = await generateObject({
            model: openai.model("gpt-4o-mini"),
            schema: evaluationSchema,
            prompt: sourceEvaluation(topic, source),
          });

          if (evaluation.object.isRelevant) {
            relevantSources.add(source.url);
            // eslint-disable-next-line no-console
            console.log(`✓ Relevant: ${source.title} - ${evaluation.object.reasoning}`);
          } else {
            irrelevantSources.add(source.url);
            // eslint-disable-next-line no-console
            console.log(`✗ Irrelevant: ${source.title} - ${evaluation.object.reasoning}`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error evaluating source ${source.url}:`, error);
          // Mark as irrelevant if evaluation fails
          irrelevantSources.add(source.url);
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Evaluation complete: ${relevantSources.size} relevant, ${irrelevantSources.size} irrelevant`);

    const researchResults: ResearchArticle[] = [];

    const extractionSchema = z.object({
      summary: z.string().describe("Brief summary of the article content"),
      keyFacts: z.array(z.string()).describe("List of key facts extracted from the article"),
      opinions: z.array(z.string()).describe("List of opinions or perspectives expressed in the article"),
    });

    for (const searchResult of allSearchResults) {
      for (const source of searchResult.results) {
        // Only process relevant sources
        if (!relevantSources.has(source.url)) {
          continue;
        }

        try {
          // eslint-disable-next-line no-console
          console.log(`Extracting content from: ${source.title}`);

          const extraction = await generateObject({
            model: openai.model("gpt-4o-mini"),
            schema: extractionSchema,
            prompt: contentExtraction(topic, source),
          });

          const article: ResearchArticle = {
            title: source.title,
            url: source.url,
            author: source.author,
            publishedDate: source.publishedDate,
            summary: extraction.object.summary,
            keyFacts: extraction.object.keyFacts,
            opinions: extraction.object.opinions,
          };

          researchResults.push(article);

          // eslint-disable-next-line no-console
          console.log(
            `✓ Extracted from "${source.title}": ${extraction.object.keyFacts.length} facts, ${extraction.object.opinions.length} opinions`
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error extracting content from ${source.url}:`, error);
          // Continue with other sources even if extraction fails
        }
      }
    }

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
