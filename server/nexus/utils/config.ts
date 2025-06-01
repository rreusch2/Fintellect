import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

interface Config {
  // Web Search
  TAVILY_API_KEY: string;
  
  // Web Scraping  
  FIRECRAWL_API_KEY: string;
  FIRECRAWL_URL: string;
  
  // Financial Data
  ALPHA_VANTAGE_API_KEY: string;
  RAPID_API_KEY: string;
  
  // OpenAI for AI processing
  OPENAI_API_KEY: string;
}

export const config: Config = {
  // Web research capabilities
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  FIRECRAWL_URL: process.env.FIRECRAWL_URL || 'https://api.firecrawl.dev',
  
  // Financial data APIs
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',
  RAPID_API_KEY: process.env.RAPID_API_KEY || '',
  
  // AI processing
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};

// Validate critical API keys
const validateConfig = () => {
  const missingKeys: string[] = [];
  
  if (!config.TAVILY_API_KEY) {
    missingKeys.push('TAVILY_API_KEY');
  }
  
  if (!config.FIRECRAWL_API_KEY) {
    missingKeys.push('FIRECRAWL_API_KEY');
  }
  
  if (!config.OPENAI_API_KEY) {
    missingKeys.push('OPENAI_API_KEY');
  }
  
  if (missingKeys.length > 0) {
    console.warn(`[Config] Missing API keys: ${missingKeys.join(', ')}`);
    console.warn('[Config] Some research features may not be available');
  } else {
    console.log('[Config] All critical API keys configured successfully');
  }
};

// Validate on import
validateConfig();

export default config; 