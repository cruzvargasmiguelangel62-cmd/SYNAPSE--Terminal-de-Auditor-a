
import { AnalysisResponse, Severity } from "../types";

const SYSTEM_PROMPT = `Eres un Auditor de Software Senior. Analiza el reporte y devuelve un JSON estructurado.
Categorías permitidas: UI/UX, Backend, Datos, Seguridad, Rendimiento.
Estructura: { "summary": "...", "issues": [ { "id": 1, "title": "...", "desc": "...", "category": "...", "severity": "Alta|Media|Baja", "fix": "..." } ] }.
No añadas texto adicional fuera del JSON. Responde en Español.`;

const handleGroqResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || response.statusText;

    if (response.status === 429) {
      throw new Error("CUOTA_GROQ_EXCEDIDA: Has superado el límite de peticiones de Groq. Intenta más tarde.");
    }
    if (response.status === 401) {
      throw new Error("API_KEY_GROQ_INVALIDA: La llave de Groq no es válida o ha expirado.");
    }
    throw new Error(`ERROR_GROQ (${response.status}): ${msg}`);
  }
  return response.json();
};

export const analyzeIssuesWithGroq = async (
  userInput: string,
  apiKey?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<AnalysisResponse> => {
  // Priorizar la key pasada, luego la del sistema (.env)
  const key = (apiKey && apiKey.trim() !== '') ? apiKey : (import.meta.env.VITE_GROQ_API_KEY || '');

  if (!key) {
    throw new Error("API_KEY_MISSING: No se encontró una clave de Groq válida (ni manual ni en .env).");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userInput }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  const data = await handleGroqResponse(response);

  try {
    const raw = data.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return parsed as AnalysisResponse;
  } catch (e) {
    throw new Error("ERROR_PARSE_DATA: Groq no devolvió JSON válido.");
  }
};

const TASK_SYSTEM_PROMPT = `Eres un Gestor de Tareas experto. Transforma la entrada en una lista de tareas pendientes.
Categorías: UI/UX, Backend, Datos, Seguridad, Rendimiento.
Prioridad: Alta, Media, Baja.
Estructura JSON: { "summary": "Resumen del plan", "issues": [ { "id": 1, "title": "Verbo imperativo...", "desc": "Contexto...", "category": "...", "severity": "...", "fix": "Primer paso..." } ] }.
Responde SOLO con el JSON.`;

export const generateTasksWithGroq = async (
  userInput: string,
  apiKey?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<AnalysisResponse> => {
  const key = (apiKey && apiKey.trim() !== '') ? apiKey : (import.meta.env.VITE_GROQ_API_KEY || '');

  if (!key) {
    throw new Error("API_KEY_MISSING: No se encontró una clave de Groq válida (ni manual ni en .env).");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: TASK_SYSTEM_PROMPT },
        { role: "user", content: userInput }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  const data = await handleGroqResponse(response);

  try {
    const content = data.choices[0].message.content;
    return JSON.parse(content) as AnalysisResponse;
  } catch (e) {
    throw new Error("Error al procesar la respuesta JSON de Groq.");
  }
};
