import { z } from 'zod';
import { tool} from 'ai';

import { queryGeneratorPrompts } from './prompts.js';
import { models } from './models.js'

import 'dotenv/config';
import Exa from 'exa-js';


const generateQueries = tool({
    description: 'Generates provided number of search queries based on the subject.',
    inputSchema: z.object({
        instructions: z.string(),
        feedback: z.string(),
        previous: z.object({
          reasoning: z.string(),
          results: z.string(),
        }),
    }),
    outputSchema: z.object({
      output: z.string().optional(),
      reasoning: z.string().optional(),
    }),
    execute: async ({instructions, feedback, previous: { reasoning, results }}) => {
      let prompt = instructions;
    
      if (previous.reasoning) {
        prompt += `\n\n<previous_reasoning> ${reasoning} </previous_reasoning>`
      }
    
      if (previous.results) {
        prompt += `\n'\n<previous_results> ${results} </previous_results>`
      }
    
      if (feedback) {
        prompt += `\n\n<feedback> ${feedback} </feedback>`
      }
    
      try {
        const response = await generateText({
          model: models.secondary,
          prompt,
          providerOptions: {
            anthropic: {
              thinking: { type: 'enabled', budgetTokens: 1024 },
            }
          }
        });
    
        return {
          output: response.steps[0].content[1].text,
          reasoning: response.steps[0].content[0].text,
        }
      } catch (error) {
        console.error(`${JSON.stringify(error)}`);
    
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