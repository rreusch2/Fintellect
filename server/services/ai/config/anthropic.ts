import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[AI] Warning: ANTHROPIC_API_KEY not found in environment variables");
}

// Initialize the Anthropic API client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ""
});

// Configure default model settings
export const defaultModelConfig = {
  temperature: 0.7,
  maxTokens: 1024,
};

// Export model names for easy reference
export const MODEL_NAMES = {
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
} as const;

// Helper function to create messages
export async function generateContent(prompt: string, config = defaultModelConfig) {
  try {
    const response = await anthropic.messages.create({
      model: MODEL_NAMES.CLAUDE_3_SONNET,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }]
    });
    
    // Access the text content safely
    const content = response.content[0];
    if ('text' in content) {
      return content.text;
    }
    throw new Error('Unexpected response format from Claude');
  } catch (error) {
    console.error('[Anthropic] Error generating content:', error);
    throw error;
  }
} 