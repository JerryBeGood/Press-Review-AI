import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, errorResponse, successResponse, verifyAuth, createLogger } from "../_shared/utils.ts";
import type { EdgeFunctionRequest, ResearchResults } from "../_shared/types.ts";
import { contentSynthesis } from "../_shared/prompts.ts";

const SynthesisSchema = z.object({
  content: z.object({
    headline: z.string().describe("The main headline of the press review"),
    intro: z.string().describe("The introductory paragraph setting up the narrative"),
    sections: z
      .array(
        z.object({
          title: z.string().describe("The thematic section heading"),
          text: z.string().describe("The narrative content synthesizing multiple sources"),
          sources: z
            .array(
              z.object({
                id: z.string().optional().describe("Optional citation marker"),
                title: z.string().describe("The title of the source article"),
                url: z.string().describe("The URL of the source"),
              })
            )
            .describe("Referenced sources for this section"),
        })
      )
      .describe("Thematic sections with synthesized narratives"),
  }),
});

serve(async (req) => {
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
    await updateGenerationStatus(supabase, generated_press_review_id, "synthesizing_content");

    const { data: generatedReview, error: fetchError } = await supabase
      .from("generated_press_reviews")
      .select("research_results, generation_context, press_reviews(topic)")
      .eq("id", generated_press_review_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch research results: ${fetchError.message}`);
    }

    if (!generatedReview?.research_results) {
      throw new Error("No research results found for this press review");
    }

    if (!generatedReview?.generation_context) {
      throw new Error("No generation context found for this press review");
    }

    const researchResults = generatedReview.research_results as ResearchResults;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = (generatedReview.press_reviews as any)?.topic || "Unknown Topic";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generationContext = generatedReview.generation_context as any;

    const openai = createOpenAIClient();

    logger.log(`Synthesizing content for ${researchResults.length} research articles`);

    const synthesis = await generateObject({
      model: openai.model("gpt-4o"),
      schema: SynthesisSchema,
      prompt: contentSynthesis(topic, researchResults, {
        persona: generationContext.persona,
        goal: generationContext.goal,
        audience: generationContext.audience,
      }),
    });

    logger.log("Content synthesis complete");

    const { error: updateError } = await supabase
      .from("generated_press_reviews")
      .update({
        content: synthesis.object.content,
        generated_at: new Date().toISOString(),
      })
      .eq("id", generated_press_review_id);

    if (updateError) {
      throw new Error(`Failed to save content: ${updateError.message}`);
    }

    await updateGenerationStatus(supabase, generated_press_review_id, "success");

    return successResponse("Content synthesized successfully");
  } catch (error) {
    logger.error("Error in synthesize-content:", error);

    await updateGenerationStatus(
      supabase,
      generated_press_review_id,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );

    return errorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
