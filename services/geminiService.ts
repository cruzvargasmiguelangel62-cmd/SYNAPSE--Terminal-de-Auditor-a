
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, Severity } from "../types";

const SYSTEM_INSTRUCTION = `Eres el sistema central de auditoría SYNAPSE // QA. 
Tu misión es procesar reportes técnicos con precisión quirúrgica.
1. Analiza con rigor: fallos de UI, errores de lógica, problemas de codificación (UTF-8) y regresiones funcionales.
2. Clasifica obligatoriamente en: 'UI/UX', 'Backend', 'Datos', 'Seguridad', 'Rendimiento'.
3. El resumen ejecutivo debe ser directo, técnico y profesional (evita saludos).
4. Para cada hallazgo: 
   - Título: Conciso y técnico.
   - Descripción: Detalle del comportamiento observado vs esperado.
   - Severidad: Alta/Media/Baja.
   - Solución: Instrucciones técnicas de remediación.
RESPONDE SIEMPRE EN ESPAÑOL. Usa terminología de ingeniería de software moderna.`;

const TASK_SYSTEM_INSTRUCTION = `Eres el gestor de incidentes SYNAPSE // TASKS.
Tu misión es transformar descripciones de lenguaje natural en una lista estructurada de tareas técnicas pendientes (To-Do List).
1. Analiza el texto entrada buscando intenciones, pendientes y requerimientos.
2. Identifica verbos de acción y contextos técnicos.
3. Clasifica cada tarea obligatoriamente en: 'UI/UX', 'Backend', 'Datos', 'Seguridad', 'Rendimiento'.
4. Asigna prioridad (Severity) basada en la urgencia o importancia del contexto (ej: seguridad/crítico -> Alta).
5. Estructura de salida:
   - Resumen: Breve descripción del plan de trabajo.
   - Título: Acción imperativa (ej: "Revisar seguridad del panel").
   - Descripción: Contexto detallado o preguntas a resolver.
   - Solución (fix): Primer paso sugerido para completar la tarea.
RESPONDE SIEMPRE EN ESPAÑOL.`;

const handleGeminiError = (error: any) => {
  const msg = error?.message || error?.toString() || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error("CUOTA_EXCEDIDA: La API de Gemini ha alcanzado su límite gratuito. Por favor intente más tarde o cambie a Groq.");
  }
  if (msg.includes('API key')) {
    throw new Error("API_KEY_INVALIDA: Verifique su llave de acceso.");
  }
  throw new Error(`ERROR_GEMINI: ${msg}`);
};

export const analyzeIssues = async (userInput: string, apiKey?: string): Promise<AnalysisResponse> => {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error("API Key requerida (Gemini).");

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userInput,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumen técnico ejecutivo" },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['UI/UX', 'Backend', 'Datos', 'Seguridad', 'Rendimiento'] },
                  severity: { type: Type.STRING, enum: [Severity.HIGH, Severity.MEDIUM, Severity.LOW] },
                  fix: { type: Type.STRING }
                },
                required: ["id", "title", "desc", "category", "severity", "fix"]
              }
            }
          },
          required: ["summary", "issues"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text.trim()) as AnalysisResponse;
  } catch (error) {
    handleGeminiError(error);
    throw error; // Fallback
  }
};

export const generateTasks = async (userInput: string, apiKey?: string): Promise<AnalysisResponse> => {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error("API Key requerida (Gemini).");

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userInput,
      config: {
        systemInstruction: TASK_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumen del plan de tareas" },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['UI/UX', 'Backend', 'Datos', 'Seguridad', 'Rendimiento'] },
                  severity: { type: Type.STRING, enum: [Severity.HIGH, Severity.MEDIUM, Severity.LOW] },
                  fix: { type: Type.STRING }
                },
                required: ["id", "title", "desc", "category", "severity", "fix"]
              }
            }
          },
          required: ["summary", "issues"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text.trim()) as AnalysisResponse;
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};
