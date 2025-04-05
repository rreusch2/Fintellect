import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY not found in environment variables. AI features may not work.");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define model names - using Claude 3.5 Sonnet as requested
export const MODEL_NAMES = {
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20240620',
  // Add other models if needed
};

export async function generateContent(prompt: string, maxTokens: number = 2000, temperature: number = 0.7): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL_NAMES.CLAUDE_3_5_SONNET,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    // Check if response.content is an array and has at least one element of type 'text'
    if (Array.isArray(response.content) && response.content.length > 0 && response.content[0].type === 'text') {
      return response.content[0].text;
    } else {
      // Handle cases where the response format is unexpected
      console.error("[Anthropic] Unexpected response format:", response);
      throw new Error("Unexpected response format received from Anthropic API.");
    }

  } catch (error: any) {
    console.error("[Anthropic] Error generating content:", error?.message || error);
    // Re-throw the error so the calling agent can handle it (e.g., provide fallback)
    throw error;
  }
}

// Optional: Export the client instance if needed elsewhere
export { anthropic }; 