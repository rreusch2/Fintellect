import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  console.warn("Warning: GOOGLE_API_KEY not found in environment variables");
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Initialize the model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateContent(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[Gemini] Error generating content:", error);
    throw error;
  }
}

export const gemini = {
  generateContent,
}; 