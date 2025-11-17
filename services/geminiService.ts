
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might use a toast notification or a different UI to show this error.
  // For this example, we'll throw an error.
  throw new Error("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const summarizeNote = async (note: string): Promise<string> => {
  if (!note.trim()) {
    return "This note is empty and cannot be summarized.";
  }

  const prompt = `Please provide a concise summary of the following sticky note. Present the summary in clear bullet points using Markdown formatting:\n\n---\n\n${note}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing note:", error);
    return "Sorry, I couldn't summarize the note at this time. Please check your API key and try again later.";
  }
};
