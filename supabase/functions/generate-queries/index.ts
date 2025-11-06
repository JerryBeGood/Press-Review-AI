import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, invokeEdgeFunction, errorResponse, successResponse } from "../_shared/utils.ts";
import { contextGeneration } from "../_shared/prompts.ts";
import type { EdgeFunctionRequest } from "../_shared/types.ts";

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

    const { object: context } = await generateObject({
      model: openai.model("gpt-4o-mini"),
      schema: z.object({
        audience: z.string().describe("The audience that the large language models aim for"),
        persona: z.string().describe("The role to inpersonate to provide audience with matching results"),
        goal: z.string().describe("The goal to pursue by the persone to provide audience with proper results"),
        domain: z.object({
          themes: z.array(z.string()).min(3).max(5).describe("Important themes within the provided topic"),
          trends: z.array(z.string()).min(3).max(5).describe("Trends that are happening right now"),
        }),
      }),
      prompt: contextGeneration(topic),
    });

    // TODO: Prompt should be exported to separate file
    // TODO: Prompt should be modified so it produces only queries
    // TODO: Prompt produces low quality queries
    // TODO: What vercel settings I can use to improve the quality of the queries?
    const {
      object: { queries },
    } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        queries: z.array(z.string()).min(3).max(10).describe("A list of search queries to research the topic"),
      }),
      prompt: `
        ${context.persona}
  
        ${context.goal}
  
        ${context.audience}
  
        Combine provided <themes> and <trends> with your own knowledge to generate SERP queries 
  
        Your task is to, given the following <topic> from the user, generate a list of press review SERP queries. To do so, combine provided <themes> and <trends> with your own knowledge of the topic. Ensure at least one query is almost identical to the initial topic. Return a maximum of 10 queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other.
  
        <topic>${topic}<topic>
  
        <themes>${context.domain.themes}</themes
        <trends>${context.domain.trends}</trends>
  
        <output_format>
          {
            "queries": [list of queries]
          }
        </output_format>
  
        <constrains>
          - You must generate a list of 3-10 SERP queries
          - You must ensure that at least one query is almost identical to the initial topic
          - You must ensure that each query is unique and not similar to each other
          - You must ensure that each query is relevant to the topic
          - You must ensure that the queries are short and concise, maximum of 5 words
        </constrains>
  
        <capabilities_and_reminders>
          - Today is ${new Date().toISOString()}.
        </capabilities_and_reminders>
      `,
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
