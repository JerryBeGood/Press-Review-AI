/**
 * AI clients configuration for Edge Functions
 * Initializes and exports OpenAI and Exa clients for use in agent functions
 */

import { openai } from "npm:@ai-sdk/openai@2.0.9";
import Exa from "npm:exa-js@1.8.27";

/**
 * Initialize OpenAI client for Vercel AI SDK
 * Requires OPENAI_API_KEY environment variable
 */
export function createOpenAIClient() {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // Return factory function for creating models
  return {
    model: (modelName: string) => openai(modelName, { apiKey }),
  };
}

export function createExaClient(): Exa {
  const apiKey = Deno.env.get("EXA_API_KEY");

  if (!apiKey) {
    throw new Error("Missing EXA_API_KEY environment variable");
  }

  return new Exa(apiKey);
}
