import { openai } from '@ai-sdk/openai';
import { generateText, generateObject, stepCountIs, tool } from 'ai';
import { z } from 'zod';

import { prompts } from './prompts.js';

import 'dotenv/config';
import Exa from 'exa-js';

const mainModel = openai('gpt-4o-mini');
const exa = new Exa(process.env.EXASEARCH_API_KEY);


async function generateSearchQueries(subject, n = 4) {
  const {
    object: { queries },
  } = await generateObject({
    model: mainModel,
    system: prompts.manager.systemPrompt,
    prompt: `
      Generate ${n} concise search queries about the subject: ${subject}. The queries should enable a comprehensive press review by covering: breaking news, emerging trends, market dynamics, and influential opinions.
    `,
    schema: z.object({
      queries: z.array(z.string()).min(1).max(5),
    }),
  })

  return queries
}

const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    console.log(query);

    const { results } = await exa.searchAndContents(query, {
      livecrawl: 'always',
      numResults: 3,
    });

    return results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.text,
      publishedDate: result.publishedDate,
    }));
  },
});

async function researchSubject(subject) {
  const result = await generateText({
    model: mainModel,
    prompt: `Search the web for the latest developments in the ${subject} and return a raport from the gathered data`,
    system: prompts.researcherSystemPrompt,
    tools: {
      webSearch,
    },
    stopWhen: stepCountIs(3),
  });
}

function validateSecrets() {
  const secrets = ['OPENAI_API_KEY', 'EXASEARCH_API_KEY'];

  for(const secret of secrets) {
    if (!process.env[secret]) {
      console.error(`Error: Missing ${secret}. Please set it in your environment or .env file.`);

      process.exit(1);
    }
  }
}

async function main() {
validateSecrets();
  
  // Read subject from CLI; default to DEFFAULT_SUBJECT if not provided
  const args = process.argv.slice(2);
  let subject = args.join(' ').trim();
  if (!subject) {
    console.log(`No subject provided via CLI. Defaulting to '${process.env.DEFAULT_SUBJECT}'.`);
    subject = process.env.DEFAULT_SUBJECT;``
  }
  
const queries = await generateSearchQueries(subject);

  console.log(JSON.stringify(queries));

  //   const research = await researchSubject(subject);

//   console.log(research.text);
}

main();

