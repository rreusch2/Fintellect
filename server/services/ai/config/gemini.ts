import axios from 'axios';

export const MODEL_NAMES = {
  DEEPSEEK_R1: 'deepseek-r1:14b',
} as const;

export const OLLAMA_CONFIG = {
  baseURL: 'http://localhost:11434',
  maxTokens: 1000,
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
} as const;

export class OllamaAI {
  private model: string;
  private config: typeof OLLAMA_CONFIG;

  constructor(model = MODEL_NAMES.DEEPSEEK_R1, config = OLLAMA_CONFIG) {
    this.model = model;
    this.config = config;
  }

  async generateContent(prompt: string) {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/api/generate`,
        {
          model: this.model,
          prompt,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            top_k: this.config.topK,
          },
          stream: false
        }
      );

      return {
        response: {
          text: () => response.data.response,
        },
      };
    } catch (error) {
      console.error('Error generating content with Ollama:', error);
      throw error;
    }
  }
}

// Initialize with local Ollama instance
export const ollamaAI = new OllamaAI(); 