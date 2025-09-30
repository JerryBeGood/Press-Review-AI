import { generateText, stepCountIs } from "ai";

import type { AnthropicModel } from "../types/models.types.ts";
import type { GenerateTextResult } from "ai";

import { models } from "../models.js";
import { generateQueries } from '../tools.js';
import { leadAgentSystemPrompt } from '../prompts.js';


interface StepContent {
  type: string;
  text?: string;
  toolName?: string;
  input?: Record<string, any>;
  output?: {
    reasoning: string;
    output: string;
  };
}


export class PressReviewLeadAgent {
  private model: AnthropicModel;
  private systemPrompt: string;
  private tools: { generateQueries: typeof generateQueries };

  constructor() {
    this.model = models.primary;
    this.systemPrompt = leadAgentSystemPrompt;
    this.tools = { generateQueries };
  }

  async run(subject: string): Promise<string> {
    const generateQueriesFails = ({ steps }: { steps: any }): boolean => {     
      const lastStep = steps[steps.length - 1];

      if (lastStep.content.some((part: StepContent) => part.type === 'tool-error' 
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
        stopWhen: [stepCountIs(10), generateQueriesFails as any],
        headers: {
            betas: 'interleaved-thinking-2025-05-14',
        },
        providerOptions: {
            anthropic: {
                thinking: { type: 'enabled' as const, budgetTokens: 2048 },
            }
        }
    }

    const response: GenerateTextResult<any, any> = await generateText({
        ...params
     });

    let output = '';
    for (const step of response.steps) {
      step.content.forEach((part) => {
        output += `TYPE: ${part.type}\n`;

        if (['reasoning', 'text'].includes(part.type)) {
            const textPart = part as { text?: string };

            output += `\n${textPart.text}\n`;
        }
          

        if(part.type === 'tool-call' && part.input)
          for (const instruction of Object.keys(part.input)) {
            const partInput = part.input as { [key: string]: any };

            output += `${instruction.toUpperCase()}: ${partInput[instruction]}\n`;
          }

        if(part.type === 'tool-result' && part.output) {
          const toolOutput = part.output as { reasoning?: string; output?: string };

          output += `REASONING: ${toolOutput.reasoning || ''}\n`;
          output += `OUTPUT: ${toolOutput.output || ''}\n`;
        }

        output += `\n\n`;
      })
    }

    return output;
  }
}

export default PressReviewLeadAgent;
