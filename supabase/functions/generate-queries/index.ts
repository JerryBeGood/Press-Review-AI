import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, errorResponse, successResponse } from "../_shared/utils.ts";
import type { EdgeFunctionRequest } from "../_shared/types.ts";

const QueriesSchema = z.object({
  conceptMap: z.object({
    mainTopic: z.string(),
    keyThemes: z.array(z.string()),
    entities: z.array(z.string()),
  }),
  queries: z.array(z.string()).min(3).max(5),
});

serve(async (req: Request) => {
  const supabase = createSupabaseClient();
  const openai = createOpenAIClient();

  const { generated_press_review_id }: EdgeFunctionRequest = await req.json();

  if (!generated_press_review_id) {
    return errorResponse("Missing generated_press_review_id", 400);
  }

  try {
    await updateGenerationStatus(supabase, generated_press_review_id, "generating_queries");

    const { data: pressReview, error: fetchError } = await supabase
      .from("generated_press_reviews")
      .select("press_review_id, press_reviews(topic)")
      .eq("id", generated_press_review_id)
      .single();

    if (fetchError || !pressReview) {
      throw new Error(`Failed to fetch press review: ${fetchError?.message}`);
    }

    const topic = pressReview.press_reviews?.topic;

    if (!topic) {
      throw new Error(`Topic not found for the press review: ${pressReview.press_review_id}`);
    }

    // TODO: Prompt should be exported to separate file
    // TODO: Prompt should be modified so it produces only the queries
    const result = await generateObject({
      model: openai.model("gpt-4o-mini"),
      schema: QueriesSchema,
      prompt: `
      You are a research assistant helping to gather information for a press review.

      Your task is to analyze the following topic and generate diverse search queries that will help find relevant news articles and information.

      Topic: "${topic}"

      First, create a concept map to identify:
      1. The main topic
      2. Key themes and subtopics
      3. Important entities (people, organizations, technologies, etc.)

      Then, based on this concept map, generate 3-5 diverse search queries that:
      - Cover different angles and aspects of the topic
      - Use varied terminology and phrasing
      - Target different types of sources (news, analysis, technical articles)
      - Are specific enough to find relevant results but broad enough to get coverage
      `,
    });

    const { error: updateError } = await supabase
      .from("generated_press_reviews")
      .update({
        generated_queries: result.object.queries,
      })
      .eq("id", generated_press_review_id);

    if (updateError) {
      throw new Error(`Failed to save queries: ${updateError.message}`);
    }

    return successResponse("Queries generated successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in generate-queries:", error);

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
