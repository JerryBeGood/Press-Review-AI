import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import {
  updateGenerationStatus,
  invokeEdgeFunction,
  errorResponse,
  successResponse,
  verifyAuth,
  createLogger,
} from "../_shared/utils.ts";
import { contextGeneration, queryGeneration } from "../_shared/prompts.ts";
import { MIN_NEWS_ANGLES, MAX_NEWS_ANGLES, QUERIES_PER_ANGLE } from "../_shared/config.ts";
import type { EdgeFunctionRequest, GenerationContext } from "../_shared/types.ts";

const contextSchema = z.object({
  audience: z.string().describe("The audience that the large language models aim for"),
  persona: z.string().describe("The role to impersonate to provide audience with matching results"),
  goal: z.string().describe("The goal to pursue by the persona to provide audience with proper results"),
  news_angles: z
    .array(
      z.object({
        name: z.string().describe("Name of the news angle"),
        description: z.string().describe("Description of the news angle"),
        keywords: z.array(z.string()).describe("List of keywords acting as triggers"),
      })
    )
    .min(MIN_NEWS_ANGLES)
    .max(MAX_NEWS_ANGLES)
    .describe("List of news angles to investigate"),
});

const querySchema = z.object({
  queries: z
    .array(z.string())
    .min(QUERIES_PER_ANGLE * MIN_NEWS_ANGLES)
    .max(QUERIES_PER_ANGLE * MAX_NEWS_ANGLES)
    .describe("A list of search queries to research the topic"),
});

serve(async (req: Request) => {
  // Verify authentication
  const authError = verifyAuth(req);
  if (authError) {
    return authError;
  }

  const supabase = createSupabaseClient();
  const openai = createOpenAIClient();

  const { generated_press_review_id }: EdgeFunctionRequest = await req.json();

  if (!generated_press_review_id) {
    return errorResponse("Missing generated_press_review_id", 400);
  }

  const logger = createLogger(generated_press_review_id);

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

    const { object: context } = await generateObject({
      model: openai.model("gpt-4o-mini"),
      schema: contextSchema,
      prompt: contextGeneration(topic),
    });

    const { error: contextUpdateError } = await supabase
      .from("generated_press_reviews")
      .update({
        generation_context: context,
      })
      .eq("id", generated_press_review_id);

    if (contextUpdateError) {
      throw new Error(`Failed to save generation context: ${contextUpdateError.message}`);
    }

    const {
      object: { queries },
    } = await generateObject({
      model: openai.model("gpt-4o-mini"),
      schema: querySchema,
      prompt: queryGeneration(topic, context as GenerationContext),
    });

    const { error: updateError } = await supabase
      .from("generated_press_reviews")
      .update({
        generated_queries: queries,
      })
      .eq("id", generated_press_review_id);

    if (updateError) {
      throw new Error(`Failed to save queries: ${updateError.message}`);
    }

    invokeEdgeFunction("execute-research", {
      generated_press_review_id,
    });

    return successResponse("Queries generated successfully");
  } catch (error) {
    logger.error("Error in generate-queries:", error);

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
