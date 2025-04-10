"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const url = process.env.GEMINI_API_URL;

if (!url) throw new Error("GEMINI_API_URL is not set in the .env file");
const genAI = new GoogleGenerativeAI(url);

export async function callGeminiAI<T>(prompt: string): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21",
  });

  const response = await model.generateContent(prompt);

  const responseText = response.response
    .text()
    .replace(/```json|```/g, "")
    .trim();

  return responseText as unknown as T;
}
