import { generateText, stepCountIs } from "ai";

import type { AnthropicModel } from "../types/models.types.js";
import type { GenerateTextResult } from "ai";

import { models } from "../models.js";
import { generateQueries } from '../tools.js';
import { leadAgentSystemPrompt } from '../prompts.js';


interface OutputItem {
  type: string;
  text?: string;
  instructions?: Instruction[];
  reasoning?: string;
  output?: string;
}


export class LeadAgent {
  private model: AnthropicModel;
  private systemPrompt: string;
  private tools: { generateQueries: typeof generateQueries };

  constructor() {
    this.model = models.primary!;
    this.systemPrompt = leadAgentSystemPrompt;
    this.tools = { generateQueries };
  }

  async run(subject: string): Promise<OutputItem[]> {
    const generateQueriesFails = ({ steps }: { steps: any }): boolean => {     
      const lastStep = steps[steps.length - 1];

      if (lastStep.content.some((part: any) => part.type === 'tool-error' 
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

    return this.prepareOutput(response);
  }

  prepareOutput(textResult: GenerateTextResult<any, any>): OutputItem[] {
    const output: Array<Object> = [];
    for (const step of textResult.steps) {
      step.content.forEach((part) => {
        const obj: any = { type: part.type };

        if (['reasoning', 'text'].includes(part.type)) {
          const textPart = part as { text?: string };
          obj.text = textPart.text || '';
        }

        if (part.type === 'tool-call' && part.input) {
          obj.instructions = [];
          for (const instruction of Object.keys(part.input)) {
            const partInput = part.input as { [key: string]: any };
            obj.instructions.push({
              name: instruction,
              value: partInput[instruction]
            });
          }
        }

        if (part.type === 'tool-result' && part.output) {
          const toolOutput = part.output as { reasoning?: string; output?: string };
          obj.reasoning = toolOutput.reasoning || '';
          obj.output = toolOutput.output || '';
        }

        output.push(obj);
      });
    }

    console.log(JSON.stringify(output));

    return output;
  }
}

export default LeadAgent;
