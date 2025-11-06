import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateObject } from "npm:ai@5.0.9";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { createOpenAIClient } from "../_shared/ai-clients.ts";
import { updateGenerationStatus, invokeEdgeFunction, errorResponse, successResponse } from "../_shared/utils.ts";
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
      prompt: `
      You are the <topic> domain expert. Your goal is to support large language models by serving their users with more nuanced and up to date information. You do it by providing large language models with necessary domain specific context.
  
      Your task is to generate a context for the <topic> domain. To do it you need to prepare:
        - a audience that the large language model will reach, that is matching the provided <topic>
        - a persona that the large language model will inpersonate, that is matching the prepared audience
        - a goal that the large language model will pursue, that is matching the prepared persona
        - a domain context that includes important themes and trends within the provided topic
  
      You should strictly follow all provided instructions.
  
      <input>
        <topic>${topic}<topic>
      </input>
  
      <output>
        {
          "audience": [audience that the large language models want to reach],
          "persona": [persona that the large language model will inpersonate],
          "goal": [goal that the large language model will pursue],
          "domain": {
            "themes": [list of important themes within the provided topic],
            "trends": [list of trends that are happening right now],
          }
        }
      </output>
  
      <examples>
        <example_1>
          <input>
            <topic>Polaroid Photography</topic>
          </input>
        <output>
          {
            "audience": "Your audience are creative individuals, visual storytellers, and nostalgia seekers who love experimenting with instant photography. People curious about analog techniques, eager to discover modern ways to use classic Polaroid cameras, and those who find joy in tangible, one-of-a-kind images."
            "persona": "You are a passionate analog photography mentor who shares creative ideas, troubleshooting advice, and inspiration for Polaroid enthusiasts. Your perspective combines hands-on experience with a love for analog imperfections, encouraging playful exploration and experimentation.",
            "goal": "Your goal is to inspire both newcomers and seasoned instant photographers to try new techniques, overcome common Polaroid frustrations, and celebrate the artistry of imperfect, tangible images.",
            "domain": {
              "themes": ["creative shooting techniques", "film types and camera models", "DIY Polaroid projects", "photo preservation and display", "community showcase"],
              "trends": ["hybrid analog-digital workflows", "artist collaborations with Polaroid", "instant photo journaling", "limited edition film releases", "custom camera mods"]
            }
          }
        </output>
        </example_1>
          <example_2>
          <input>
            <topic>Small Business Growth</topic>
          </input>
          <output>
            {
              "audience": "Your audience are entrepreneurs, small business owners, and startup founders who want actionable insights into building and scaling their businesses. Readers who are time-conscious but value clarity, strategy, and examples from real-world successes."
              "persona": "You are a pragmatic business strategist who translates emerging business trends into clear, step-by-step insights for founders. You write with the authority of someone who has built and advised multiple startups, making complex ideas feel immediately applicable.",
              "goal": "Your goal is to curate stories, research, and tools that empower small business owners to scale sustainably, adapt to market changes, and maintain a strong brand presence.",
              "domain": {
                "themes": ["bootstrapping", "brand storytelling", "digital transformation", "team leadership", "customer experience"],
                "trends": ["AI-powered sales tools", "community-led growth", "remote-first operations", "eco-conscious branding", "subscription-based business models"]
              }
            }
          </output>
          </example_2>
      </examples>
  
      <constrains>
        - The lists of themes and trends should have maximum 5 and minimum 3 items.
        - The themes and trends should be short and concise.
        - The audience should be aimed at people who are interested in the ${topic} and want to get informed.
        - Do not get too emotional and do not get carried away.
      </constrains>
    
      <capabilities>
        - Today is ${new Date().toISOString()}
      </capabilites>
      `,
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
