import type { anthropic } from "@ai-sdk/anthropic";
import type { openai } from "@ai-sdk/openai";

export type OpenAIModel = ReturnType<typeof openai>;
export type AnthropicModel = ReturnType<typeof anthropic>;

export type Provider = OpenAIModel | AnthropicModel;

export type Models = Record<string, Provider>;
