import {tool } from 'ai';
import { z } from 'zod';

import { manager } from './prompts.js';
import { models } from './models.js'

import 'dotenv/config';
import Exa from 'exa-js';


const generateQueries = tool({
    description: 'Generates provided number of search queries based on the subject',
    inputSchema: z.object({
        number: z.number().lte(5),
        subject: z.string(),
    }),
    execute: async (number, subject) => {
        const {
            object: { queries },
          } = await generateObject({
            model: models.main,
            prompt: `
              Design ${number} precise and effective research queries that will guide the research agent in producing a comprehensive press review on the following subject: ${subject}.
            `,
            system: manager.systemPrompt,
            schema: z.object({
              queries: z.array(z.string()).min(1).max(5),
            }),
          })
        
          return queries
    }
})

const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const exa = new Exa(process.env.EXASEARCH_API_KEY);

    const { results } = await exa.searchAndContents(query, {
      livecrawl: 'always',
      numResults: 3,
    });

    return results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.text,
      publicationDate: result.publishedDate,
    }));
  },
});

export {
  generateQueries,
  webSearch
}