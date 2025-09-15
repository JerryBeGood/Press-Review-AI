import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

// TODO: There must be a different model then OpenAI because of the privacy concerns -> DeepSeek R1, Llama4 or Claude-Sonnet-3.7
// 
const models = {
  main: openai('o4-mini'),
  primary: anthropic('claude-sonnet-4-20250514'),
  secondary: anthropic('claude-3-7-sonnet-20250219'),
};

export { models };

