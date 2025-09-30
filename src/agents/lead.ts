import { generateText, stepCountIs } from "ai";

import { models } from "../models.js";
import { generateQueries } from '../tools.js';
import { leadAgentPrompts } from '../prompts.js';


export class PressReviewLeadAgent {
  constructor() {
    this.model = models.primary;
    this.prompt = leadAgentPrompts.input;
    this.systemPrompt = leadAgentPrompts.system;
    this.tools = { generateQueries };
  }

  async run(subject) {
    const generateQueriesFails = ({ steps }) => {     
      const lastStep = steps[steps.length - 1];

      if (lastStep.content.some((part) => part.type === 'tool-error' 
        && part.toolName === 'generateQueries')) {
          console.log('Tool error: generateQueries');
          console.log(JSON.stringify(lastStep.content));

          return true;
      }

      return false;
    }

    const params = {
      model: this.model,
      prompt: `Generate search queries on the subject ${subject}.`,
      system: this.systemPrompt,
      tools: this.tools,
      stopWhen: [stepCountIs(10), generateQueriesFails],
      headers: {
        betas: ['interleaved-thinking-2025-05-14'],
      },
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 2048 },
        }
      }
    }

    const response = await generateText({ ...params });
    let output = '';

    for (const step of response.steps) {
      step.content.forEach((part) => {
        output += `TYPE: ${part.type}\n`;

        if (['reasoning', 'text'].includes(part.type))
          output += `\n${part.text}\n`;

        if(part.type === 'tool-call')
          for (const instruction of Object.keys(part.input)) {
            output += `${instruction.toUpperCase()}: ${part.input[instruction]}\n`;
          }

        if(part.type === 'tool-result') {
          output += `REASONING: ${part.output.reasoning}\n`;
          output += `OUTPUT: ${part.output.output}\n`;
        }

        output += `\n\n`;
      })
    }

    return output;
  };
}

export default PressReviewLeadAgent;
