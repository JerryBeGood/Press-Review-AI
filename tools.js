import { z } from 'zod';
import { tool, generateText } from 'ai';

import { queryGeneratorPrompts } from './prompts.js';
import { models } from './models.js'

import 'dotenv/config';
import Exa from 'exa-js';


const generateQueries = tool({
    description: `Generate the requested number of search queries for the given subject. Provide feedback with reasoning and previous results (if any) to improve the next attempt.`,
    inputSchema: z.object({
        instructions: z.string(),
        feedback: z.string().optional(),
        previousReasoning: z.string().optional(),
        previousResults: z.string().optional(),
    }),
    outputSchema: z.object({
      output: z.string().optional(),
      reasoning: z.string().optional(),
    }),
    execute: async ({ instructions, feedback, previousReasoning, previousResults }) => {
      const parts = [instructions];

      const appendTagged = (tag, value) => {
        if (value) parts.push(`<${tag}> ${value} </${tag}>`);
      };

      appendTagged('previous_reasoning', previousReasoning);
      appendTagged('previous_results', previousResults);
      appendTagged('feedback', feedback);

      const params = {
        model: models.secondary,
        prompt: parts.join('\n\n'),
        system: queryGeneratorPrompts.system,
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 1024 },
          }
        }
      }

      try {
        const response = await generateText({ ...params });

        const output = {
          output: response.steps[0].content[1].text,
          reasoning: response.steps[0].content[0].text,
        }

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