import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
}

/**
 * Singleton Gemini client instance
 * Initialized once with API key from environment
 */
export const geminiClient = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

/**
 * Get the Gemini image generation model
 * Model: gemini-2.5-flash-image (aka "Nano Banana")
 */
export function getImageModel() {
    return geminiClient.getGenerativeModel({
        model: 'gemini-2.5-flash-image'
    });
}
