import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';


type Provider = ReturnType<typeof openai> | ReturnType<typeof anthropic>;

interface Models {
  [key: string]: Provider;
}

export type { Models };