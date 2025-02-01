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
      console.log('[Ollama] Sending request:', {
        model: this.model,
        endpoint: `${this.config.baseURL}/api/completion`,
        prompt: prompt.substring(0, 100) + '...' // Log truncated prompt
      });

      const response = await axios.post(
        `${this.config.baseURL}/api/completion`,
        {
          model: this.model,
          prompt,
          stream: false,
          raw: true,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            top_k: this.config.topK,
            num_predict: this.config.maxTokens
          }
        },
        {
          timeout: 30000
        }
      );

      console.log('[Ollama] Response received:', {
        status: response.status,
        hasResponse: !!response.data?.response
      });

      if (!response.data?.response) {
        throw new Error('No response data from Ollama');
      }

      return {
        response: {
          text: () => response.data.response,
        },
      };
    } catch (error) {
      console.error('[Ollama] Error generating content:', error);
      if (axios.isAxiosError(error)) {
        console.error('[Ollama] Request details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }
}

// Initialize with local Ollama instance
export const ollamaAI = new OllamaAI(); 