import { generateObject } from "ai";
import { z } from 'zod';

import { models } from "../models.js";
import { generateQueries } from '../tools.js';


export class PressReviewLeadAgent {
  constructor(options = {}) {
    this.model = options.model || models.main;
    this.systemPrompt = options.systemPrompt;
    this.tools = options.tools || { generateQueries };
  }

  async run(subject) {
    const { object } = await generateObject({
        model: this.model,
        schema: z.object({
          queries: z.array(
            z.string(),
          ),
        }),
        system: `
          You are a press review lead. You are focused on high-level press review strategy, planning and effective delegation to sub-agents.

          Your task is to lead the process of press review on the given subject.

          You do it by delegating preparation of research queries to your sub-agent by following a <query_preparation_process>.

          <query_preparation_process>
        
            1. Think deeply about the subject to understand what would be the best strategy for conducting a press review.
            2. Based on the previous step prepare a clear instructions on how to create research queries and delegate the task to the sub-agent using generateQueries tool.
            3. Analyse the queries prepared by the sub-agent and judge them critically. If in your opinion they are not good enough, provide the sub-agent with a feedback and go back to step 2 of the <query_preparation_process>.

            If they are good you can proceede to the next step of the <query_preparation_process>.
            4. Return prepared queries to the user.

            Do not create the queries yourself. ALWAYS delegate this task to a sub-agent.

          </query_preparation_process>
        `,
        prompt: `
          Conduct a press review on the ${subject} and return the search queries.
        `,
        tools: this.tools,
    })

    return object;
  };
}

export default PressReviewLeadAgent;
