import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, errorResponse, successResponse } from "../_shared/utils.ts";
import type { EdgeFunctionRequest, ResearchResults } from "../_shared/types.ts";

// Schema for synthesized press review content
const SynthesisSchema = z.object({
  content: z.object({
    general_summary: z
      .string()
      .describe(
        "A comprehensive summary of all the research findings, synthesizing the key information from all sources"
      ),
    segments: z
      .array(
        z.object({
          title: z.string().describe("The title of the article or source"),
          summary: z.string().describe("A concise summary of this specific source's contribution to the topic"),
          link: z.string().describe("The URL of the source"),
        })
      )
      .describe("Individual segments representing each relevant source with their summaries"),
  }),
  analysis: z.object({
    totalSourcesEvaluated: z.number().describe("Total number of sources that were analyzed"),
    relevantSources: z.number().describe("Number of sources that were relevant to the topic"),
    irrelevantSources: z.number().describe("Number of sources that were not relevant"),
    keyThemes: z.array(z.string()).describe("Main themes or topics discovered across all sources"),
    sourceQualityNotes: z.string().describe("Assessment of the overall quality, diversity, and reliability of sources"),
  }),
});

serve(async (req) => {
  const supabase = createSupabaseClient();
  const { generated_press_review_id }: EdgeFunctionRequest = await req.json();

  if (!generated_press_review_id) {
    return errorResponse("Missing generated_press_review_id", 400);
  }

  try {
    // Update status to 'synthesizing_content'
    await updateGenerationStatus(supabase, generated_press_review_id, "synthesizing_content");

    // Step 1: Fetch the research_results and topic from the database
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

    // Step 2: Synthesize content and analysis using AI
    const ai = createOpenAIClient();

    // Prepare research data for the prompt
    const researchSummary = researchResults
      .map(
        (article, idx) => `
Source ${idx + 1}:
- Title: ${article.title}
- URL: ${article.url}
- Author: ${article.author || "Unknown"}
- Published: ${article.publishedDate || "Unknown"}
- Summary: ${article.summary}
- Key Facts: ${article.keyFacts.join("; ")}
- Opinions: ${article.opinions.join("; ")}
`
      )
      .join("\n---\n");

    // eslint-disable-next-line no-console
    console.log(`Synthesizing content for ${researchResults.length} research articles`);

    const synthesis = await generateObject({
      model: ai.model("gpt-4o"),
      schema: SynthesisSchema,
      prompt: `You are a professional journalist tasked with creating a comprehensive press review.

Your role is to:
1. Synthesize information from multiple sources into a coherent, well-structured press review
2. Create a general summary that captures the overall narrative and key insights
3. Generate individual segments for each relevant source with concise summaries
4. Include proper references to sources (URLs)
5. Analyze the quality and relevance of sources
6. Identify key themes across all sources

Topic: "${topic}"

Research Sources:
${researchSummary}

Instructions:
- Write in a professional, journalistic style
- Be objective and balanced
- Synthesize information across sources, identifying patterns and contradictions
- The general_summary should be comprehensive (3-4 paragraphs) and provide a complete overview
- Each segment should be concise but informative
- Reference facts and opinions from the sources naturally
- In the analysis, assess source diversity, credibility, and coverage quality
- Identify 3-5 key themes that emerge from the sources
- Count sources accurately: totalSourcesEvaluated = ${researchResults.length}

Generate a complete press review with content and analysis.`,
    });

    // eslint-disable-next-line no-console
    console.log("Content synthesis complete");

    // Save the synthesized content and analysis
    const { error: updateError } = await supabase
      .from("generated_press_reviews")
      .update({
        content: synthesis.object.content,
        analysis: synthesis.object.analysis,
        generated_at: new Date().toISOString(),
      })
      .eq("id", generated_press_review_id);

    if (updateError) {
      throw new Error(`Failed to save content: ${updateError.message}`);
    }

    // Update status to success
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
