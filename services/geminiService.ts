import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Re-throw the error to be handled by the component.
    // This allows the UI to show a more specific error state.
    throw new Error("Failed to connect to the summarization service. Please check your connection or try again later.");
  }
};