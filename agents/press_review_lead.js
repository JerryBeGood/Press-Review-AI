import { generateObject } from "ai";
import { models } from "../models";

import { generateQueries } from '../tools.js';
import { prompts } from '../prompts.js';


class ManagerAgent {
  constructor(options = {}) {
    this.model = options.model || models.main;
    this.systemPrompt = options.systemPrompt;
    this.tools = options.tools || { generateQueries };
  }

  async run() {
    const { object } = await generateObject({
        model: this.model,
        system: this.systemPrompt,
        prompt: '',
        tools: this.tools,
    })

    return object;
  };
}

export default ManagerAgent;
