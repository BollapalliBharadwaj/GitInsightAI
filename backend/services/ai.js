import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class AIService {
  constructor() {
    this.modelName = config.ollama.model;
    this.llm = new ChatOllama({
      baseUrl: config.ollama.baseUrl,
      model: this.modelName,
      temperature: 0.2,
    });
  }

  async generateResponse(prompt, systemPrompt = "You are a helpful AI assistant.") {
    try {
      const response = await this.llm.invoke([
        ["system", systemPrompt],
        ["human", prompt]
      ]);
      return response.content;
    } catch (error) {
      logger.error(`Ollama AI generation failed: ${error.message}`);
      throw new Error("AI service unavailable");
    }
  }
}
