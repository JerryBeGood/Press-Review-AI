import {tool } from 'ai';
import { z } from 'zod';

import { prompts } from './prompts.js';

const mainModel = openai('gpt-4o-mini');

export const generateQueries = tool({
    description: 'Generates provided number of search queries based on the subject',
    inputSchema: z.object({
        number: z.number().min(1).maxValue(5),
        subject: z.string(),
    }),
    execute: async (number, subject) => {
        const {
            object: { queries },
          } = await generateObject({
            model: mainModel,
            prompt: `
              Design ${number} precise and effective research queries that will guide the research agent in producing a comprehensive press review on the following subject: ${subject}.
            `,
            system: prompts.manager.systemPrompt,
            schema: z.object({
              queries: z.array(z.string()).min(1).max(5),
            }),
          })
        
          return queries
    }
})
