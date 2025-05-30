import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY not found in environment variables");
} else {
  console.log("ANTHROPIC_API_KEY is set:", process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO');
}

// Configure default model settings
export const defaultModelConfig = {
  temperature: 0.7,
  maxTokens: 4096,
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

// Helper function to generate streaming content
export async function generateStreamingContent(
  prompt: string, 
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    console.log('[Anthropic] Starting streaming request...');
    console.log(`[Anthropic] API Key status: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`[Anthropic] Prompt preview: ${prompt.substring(0, 100)}...`);
    
    const startTime = Date.now();
    
    const stream = await anthropicClient.messages.create({
      model: MODEL_NAMES.CLAUDE_3_SONNET,
      max_tokens: defaultModelConfig.maxTokens,
      temperature: defaultModelConfig.temperature,
      messages: [{ role: "user", content: prompt }],
      stream: true
    });
    
    console.log(`[Anthropic] Stream created in ${Date.now() - startTime}ms, starting to process chunks...`);
    
    let fullResponse = '';
    let chunkCount = 0;
    let textChunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
      console.log(`[Anthropic] Received chunk ${chunkCount}:`, {
        type: chunk.type,
        hasData: !!chunk.delta,
        deltaType: chunk.delta?.type || 'none',
        fullChunk: JSON.stringify(chunk).substring(0, 200) + '...'
      });
      
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = chunk.delta.text;
        if (text) {
          textChunkCount++;
          console.log(`[Anthropic] Processing text chunk ${textChunkCount}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          fullResponse += text;
          onChunk(text);
        }
      } else if (chunk.type === 'content_block_start') {
        console.log(`[Anthropic] Content block started:`, chunk.content_block?.type);
      } else if (chunk.type === 'message_start') {
        console.log(`[Anthropic] Message started:`, chunk.message?.role);
      } else if (chunk.type === 'message_delta') {
        console.log(`[Anthropic] Message delta:`, chunk.delta);
      } else if (chunk.type === 'message_stop') {
        console.log(`[Anthropic] Message stopped`);
      } else {
        console.log(`[Anthropic] Skipping chunk type: ${chunk.type}, delta type: ${chunk.delta?.type}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[Anthropic] Streaming complete in ${totalTime}ms:`);
    console.log(`  - Total chunks: ${chunkCount}`);
    console.log(`  - Text chunks: ${textChunkCount}`);
    console.log(`  - Response length: ${fullResponse.length} characters`);
    console.log(`  - First 200 chars: ${fullResponse.substring(0, 200)}...`);
    
    if (fullResponse.length === 0) {
      throw new Error('Streaming completed but response is empty');
    }
    
    return fullResponse;
  } catch (error) {
    console.error("[Anthropic] Error generating streaming content:", error);
    console.error("[Anthropic] Error details:", {
      name: error.name,
      message: error.message,
      status: error.status,
      error: error.error,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    throw error;
  }
}

export const anthropic = {
  generateContent,
  generateStreamingContent,
}; 