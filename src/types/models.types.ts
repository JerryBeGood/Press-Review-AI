import type { anthropic } from '@ai-sdk/anthropic';
import type { openai } from '@ai-sdk/openai';

type OpenAIModel = ReturnType<typeof openai>;
type AnthropicModel = ReturnType<typeof anthropic>;

type Provider = OpenAIModel | AnthropicModel;

interface Models {
  [key: string]: Provider;
}

export type {
  Models,
  AnthropicModel,
};