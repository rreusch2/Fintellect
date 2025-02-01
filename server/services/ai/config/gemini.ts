import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  console.warn("[AI] Warning: GOOGLE_API_KEY not found in environment variables");
}

// Initialize the Gemini API client
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Configure default model settings
export const defaultModelConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// Export model names for easy reference
export const MODEL_NAMES = {
  GEMINI_PRO: "gemini-pro",
  GEMINI_PRO_VISION: "gemini-pro-vision",
} as const; 