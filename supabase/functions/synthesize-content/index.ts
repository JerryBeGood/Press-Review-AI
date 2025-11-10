import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, errorResponse, successResponse } from "../_shared/utils.ts";
import type { EdgeFunctionRequest, ResearchResults } from "../_shared/types.ts";
import { contentSynthesis } from "../_shared/prompts.ts";

const SynthesisSchema = z.object({
  content: z.object({
    general_summary: z.string().describe("A general summary about what can be find in the current press review raport"),
    segments: z
      .array(
        z.object({
          category: z.string().describe("The category of the sources in the given segment"),
          summary: z.string().describe("A concise summary of this specific segment's contribution to the topic"),
          sources: z
            .array(
              z.object({
                title: z.string().describe("The title of the article or source"),
                summary: z.string().describe("A concise summary of this specific source's contribution to the topic"),
                link: z.string().describe("The URL of the source"),
              })
            )
            .describe("List of sources in the given segment"),
        })
      )
      .describe("Individual segments representing each relevant source with their summaries"),
  }),
});

serve(async (req) => {
  const supabase = createSupabaseClient();
  const { generated_press_review_id }: EdgeFunctionRequest = await req.json();

  if (!generated_press_review_id) {
    return errorResponse("Missing generated_press_review_id", 400);
  }

  try {
    await updateGenerationStatus(supabase, generated_press_review_id, "synthesizing_content");

    const { data: generatedReview, error: fetchError } = await supabase
      .from("generated_press_reviews")
      .select("research_results, press_reviews(topic)")
      .eq("id", generated_press_review_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch research results: ${fetchError.message}`);
    }

    if (!generatedReview?.research_results) {
      throw new Error("No research results found for this press review");
    }

    const researchResults = generatedReview.research_results as ResearchResults;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = (generatedReview.press_reviews as any)?.topic || "Unknown Topic";

    const openai = createOpenAIClient();

    // eslint-disable-next-line no-console
    console.log(`Synthesizing content for ${researchResults.length} research articles`);

    const synthesis = await generateObject({
      model: openai.model("gpt-4o"),
      schema: SynthesisSchema,
      prompt: contentSynthesis(topic, researchResults),
    });

    // eslint-disable-next-line no-console
    console.log("Content synthesis complete");

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
    // eslint-disable-next-line no-console
    console.error("Error in synthesize-content:", error);

    await updateGenerationStatus(
      supabase,
      generated_press_review_id,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );

    return errorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
