import { openai } from '@ai-sdk/openai';

const models = {
  main: openai('gpt-4o-mini'),
};

export { models };

