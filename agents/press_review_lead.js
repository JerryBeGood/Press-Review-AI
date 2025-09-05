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
          You are a press review lead.

          Your task is to orchestrate the process of press review on the given subject.

          You do it by delegating preparation of research queries to your sub-agent.

          You communicate with that sub-agent via tool (generateQueries) by providing it number and the subject of the queries.
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
