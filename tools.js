import { z } from 'zod';
import { tool, generateObject } from 'ai';

import { queryGeneratorPrompts } from './prompts.js';
import { models } from './models.js'

import 'dotenv/config';
import Exa from 'exa-js';


/* 
  TODO: Create a mechanism for returning labeled data e.g.:

  SUCCESS: queries: [query1, query2, query3]
  ERROR: error: "Error message"

  How lead agent should handle this?
*/
const generateQueries = tool({
    description: 'Generates provided number of search queries based on the subject',
    inputSchema: z.object({
        prompt: z.string(),
    }),
    execute: async ({ prompt }) => {
        const result = await generateObject({
            model: models.main,
            prompt: prompt,
            system: queryGeneratorPrompts.system(),
            schema: z.object({
              queries: z.array(z.string()).min(1).max(5),
            }),
          })

          return result.object.queries
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