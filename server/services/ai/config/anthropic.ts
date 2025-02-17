import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY not found in environment variables");
}

// Configure default model settings
export const defaultModelConfig = {
  temperature: 0.7,
  maxTokens: 1024,
};

// Export model names for easy reference
export const MODEL_NAMES = {
  CLAUDE_3_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307'
} as const;

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Helper function to generate content
export async function generateContent(prompt: string): Promise<string> {
  try {
    const message = await anthropicClient.messages.create({
      model: MODEL_NAMES.CLAUDE_3_SONNET,
      max_tokens: defaultModelConfig.maxTokens,
      temperature: defaultModelConfig.temperature,
      messages: [{ role: "user", content: prompt }]
    });
    
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return textContent.text;
  } catch (error) {
    console.error("[Anthropic] Error generating content:", error);
    throw error;
  }
}

export const anthropic = {
  generateContent,
}; 