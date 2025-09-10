import { generateText, stepCountIs } from "ai";

import { models } from "../models.js";
import { generateQueries } from '../tools.js';
import { leadAgentPrompts } from '../prompts.js';


export class PressReviewLeadAgent {
  constructor(options = {}) {
    this.model = options.model || models.main;
    this.systemPrompt = options.systemPrompt || leadAgentPrompts.system;
    this.tools = options.tools || { generateQueries };
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

    const result = await generateText({
        model: this.model,
        tools: this.tools,
        stopWhen: [stepCountIs(4), generateQueriesFails],
        temperature: 0.75,
        prompt: leadAgentPrompts.input(subject),
        system: leadAgentPrompts.system,
    });

    // console.log(JSON.stringify(result));

    return result.text;
  };
}

export default PressReviewLeadAgent;
