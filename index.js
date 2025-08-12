import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

import 'dotenv/config';
import Exa from 'exa-js';

const mainModel = openai('gpt-4o-mini');
const exa = new Exa(process.env.EXASEARCH_API_KEY);

const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const { results } = await exa.searchAndContents(query, {
      livecrawl: 'always',
      numResults: 3,
    });

    return results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.text.slice(0, 1000), // take just the first 1000 characters
      publishedDate: result.publishedDate,
    }));
  },
});

async function researchSubject(subject) {
  return await generateText({
    model: mainModel,
    prompt: `Search the web for the latest developments on the ${subject}`,
    system:
      'You are an expert researcher. ' +
      `You look for the data not older then a week from ${new Date().toISOString()}`,
    tools: {
      webSearch,
    }
  });
}

async function main() {
  const subject = 'ai engineering';
  const research = await researchSubject(subject);

  console.log(JSON.stringify(research));
}

main();
