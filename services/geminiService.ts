import { AnalysisResponse } from "../types";

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:4000';
};

export const analyzeIssues = async (userInput: string, apiKey?: string): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: userInput,
        provider: 'gemini',
        apiKey: apiKey,
        isTask: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en el servidor proxy');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const generateTasks = async (userInput: string, apiKey?: string): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: userInput,
        provider: 'gemini',
        apiKey: apiKey,
        isTask: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en el servidor proxy');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message);
  }
};
