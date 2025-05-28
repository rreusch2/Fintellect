import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Use the new Gemini 2.0 Flash model with enhanced capabilities
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 8192, // Max output tokens for 2.0 Flash
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

export { genAI, model };

export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[Gemini 2.0 Flash] Error generating content:", error);
    throw error;
  }
}

export const gemini = {
  generateContent,
}; 