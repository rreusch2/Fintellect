// Centralized API Configuration for Nexus
// Similar to Suna's configuration but with hardcoded keys from environment

export interface APIConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  google: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  tavily: {
    apiKey: string;
    baseUrl: string;
  };
  firecrawl: {
    apiKey: string;
    baseUrl: string;
  };
  rapidapi: {
    apiKey: string;
    baseUrl: string;
  };
  daytona: {
    apiKey?: string;
    baseUrl: string;
    dockerImage: string;
  };
}

// Load configuration from environment variables
export const apiConfig: APIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o', // Latest GPT-4 model
    maxTokens: 4096
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022', // Latest Claude model
    maxTokens: 8192
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: 'gemini-2.0-flash',
    maxTokens: 8192
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || '',
    baseUrl: 'https://api.tavily.com'
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    baseUrl: 'https://api.firecrawl.dev'
  },
  rapidapi: {
    apiKey: process.env.RAPIDAPI_KEY || '',
    baseUrl: 'https://rapidapi.com'
  },
  daytona: {
    apiKey: process.env.DAYTONA_API_KEY,
    baseUrl: process.env.DAYTONA_BASE_URL || 'http://localhost:3986',
    dockerImage: 'nexus-agent:latest'
  }
};

// Validation function to check if required API keys are present
export function validateAPIConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!apiConfig.google.apiKey) missing.push('GOOGLE_AI_API_KEY');
  if (!apiConfig.openai.apiKey) missing.push('OPENAI_API_KEY (optional but recommended)');
  if (!apiConfig.anthropic.apiKey) missing.push('ANTHROPIC_API_KEY (optional but recommended)');
  if (!apiConfig.tavily.apiKey) missing.push('TAVILY_API_KEY (for search capabilities)');
  if (!apiConfig.firecrawl.apiKey) missing.push('FIRECRAWL_API_KEY (for web scraping)');
  
  return {
    valid: missing.length === 0 || (apiConfig.google.apiKey !== ''), // At least Google AI is required
    missing
  };
}

// Get the best available LLM provider
export function getBestLLMProvider(): 'anthropic' | 'openai' | 'google' {
  if (apiConfig.anthropic.apiKey) return 'anthropic';
  if (apiConfig.openai.apiKey) return 'openai';
  return 'google'; // Fallback to Google
}

// Export individual configurations for easy access
export const {
  openai: openaiConfig,
  anthropic: anthropicConfig,
  google: googleConfig,
  tavily: tavilyConfig,
  firecrawl: firecrawlConfig,
  rapidapi: rapidapiConfig,
  daytona: daytonaConfig
} = apiConfig; 