import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

import { Models } from './types/models.types';


const models: Models = {
  main: openai("o4-mini"),
  primary: anthropic("claude-sonnet-4-20250514"),
  secondary: anthropic('claude-3-7-sonnet-20250219')
};

export { models };
