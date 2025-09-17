import { generateText, stepCountIs } from "ai";

import { models } from "../models.js";
import { generateQueries } from '../tools.js';
import { leadAgentPrompts } from '../prompts.js';


export class PressReviewLeadAgent {
  constructor(options = {}) {
    this.model = options.model || models.primary;
    this.systemPrompt = options.systemPrompt || leadAgentPrompts.system;
    this.tools = options.tools || { generateQueries };
  }


  // TODO: I must make tool requirements explicit and make sure that interleaved thinking mode is enabled
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

    const response = await generateText({
        model: this.model,
        tools: this.tools,
        stopWhen: [stepCountIs(10), generateQueriesFails],
        prompt: leadAgentPrompts.input(subject),
        system: this.systemPrompt,
        headers: {
          betas: ['interleaved-thinking-2025-05-14'],
        },
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 2048 },
          }
        }
    });

    for (const step of response.steps) {
      step.content.forEach((part) => {
        console.log(`TYPE: ${part.type}`);

        if (['reasoning', 'text'].includes(part.type))
          console.log(`TEXT: ${part.text}`);

        if(part.type === 'tool-call')
          for (const instruction of Object.keys(part.input)) {
            console.log(`${instruction.toUpperCase()}: ${part.input[instruction]}`);
          }

        if(part.type === 'tool-result') {
          console.log(`REASONING: ${part.output.reasoning}`);
          console.log(`OUTPUT: ${part.output.output}`);
        }

        console.log(`\n\n`);
      })
    }
  };
}

export default PressReviewLeadAgent;
