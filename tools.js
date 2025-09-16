import { z } from 'zod';
import { tool, generateText } from 'ai';

import { queryGeneratorPrompts } from './prompts.js';
import { models } from './models.js'

import 'dotenv/config';
import Exa from 'exa-js';


const generateQueries = tool({
    description: `Generate provided number of search queries on the given subject.`
      + `Provide feedback together with reasoning and results from previous call to improve the results.`,
    inputSchema: z.object({
        instructions: z.string(),
        feedback: z.string().optional(),
        previous: z.object({
          reasoning: z.string(),
          results: z.string(),
        }).optional(),
    }),
    outputSchema: z.object({
      output: z.string().optional(),
      reasoning: z.string().optional(),
    }),
    execute: async ({ instructions, feedback, previous }) => {
      const parts = [instructions];

      const appendTagged = (tag, value) => {
        if (value) parts.push(`<${tag}> ${value} </${tag}>`);
      };

      appendTagged('previous_reasoning', previous?.reasoning);
      appendTagged('previous_results', previous?.results);
      appendTagged('feedback', feedback);

      const prompt = parts.join('\n\n');

      try {
        const response = await generateText({
          model: models.secondary,
          prompt,
          system: queryGeneratorPrompts.system,
          providerOptions: {
            anthropic: {
              thinking: { type: 'enabled', budgetTokens: 1024 },
            }
          }
        });

        const output = {
          output: response.steps[0].content[1].text,
          reasoning: response.steps[0].content[0].text,
        }

        // console.log('SUB AGENT OUTPUT:');
        // console.log(JSON.stringify(output));

        return output;
      } catch (error) {
        console.log(`ERROR: ${error}`);
    
        return {};
      }
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