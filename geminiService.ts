
import { GoogleGenAI } from "@google/genai";
import { Student, Bus, Route } from "../types.ts";

// Helper to safely get the API Key without crashing the app
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : '');
  } catch (e) {
    return '';
  }
};

export const getDriverAssistantResponse = async (
  query: string,
  students: Student[],
  routeName: string,
  direction: string
) => {
  const apiKey = getApiKey();
  if (!apiKey) return "AI Error: API Key not found. Please check app configuration.";

  const ai = new GoogleGenAI({ apiKey });
  
  const context = `
    You are 'BusPro Assistant', a tool for a school bus driver.
    Current Context: ${routeName} - ${direction}.
    Student List: ${JSON.stringify(students)}
    
    Instructions:
    1. Help the driver find information in their list quickly.
    2. Answer questions about addresses, parent names, or notes.
    3. Keep answers extremely short and professional (1-2 sentences).
    4. If asked about something not in the list, say "I don't have that info in your current route list."
    5. The driver is working; do not use flowery language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: context,
        temperature: 0.3,
      },
    });

    return response.text || "I couldn't process that. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Error: Failed to connect. Check your internet.";
  }
};

export const getBusBotResponse = async (
  query: string,
  buses: Bus[],
  routes: Route[]
) => {
  const apiKey = getApiKey();
  if (!apiKey) return "AI Error: API Key not found.";

  const ai = new GoogleGenAI({ apiKey });
  
  const context = `
    You are 'BusBot', an AI logistics assistant for school bus fleet management.
    Current Fleet Status: ${JSON.stringify(buses)}
    Available Routes: ${JSON.stringify(routes)}
    
    Instructions:
    1. Answer questions about bus status, delays, occupancy, and route details.
    2. Be concise but helpful.
    3. If you don't know something based on the data, admit it.
    4. Provide actionable insights if relevant.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: context,
      },
    });

    return response.text || "I'm having trouble accessing the fleet data right now.";
  } catch (error) {
    console.error("BusBot Error:", error);
    return "AI Error: Logistics server unreachable.";
  }
};
