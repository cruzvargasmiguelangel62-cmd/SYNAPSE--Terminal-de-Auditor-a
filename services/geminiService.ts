import { AnalysisResponse } from "../types";

const getApiUrl = () => {
  // en producción el frontend y el backend suelen compartir el mismo dominio,
  // por lo que usamos el origen actual como URL base si no se provee
  // explícitamente una variable de entorno.
  let base = import.meta.env.VITE_API_URL || window.location.origin;

  // si el valor termina con `/api` o `/api/analyze` lo eliminamos para evitar
  // duplicaciones cuando construimos las rutas.
  base = base.replace(/\/(?:api(?:\/analyze)?)$/i, '');

  // quitar barras finales extras
  base = base.replace(/\/+$/, '');

  return base;
};

// Normaliza la estructura devuelta por el backend/IA para que siempre tenga
// la forma { summary: string; issues: Issue[] }.
// El modelo a veces responde con claves en español como `tareas_pendientes`.
const normalizeResponse = (obj: any) => {
  if (!obj) throw new Error('Respuesta vacía del servidor');
  const rawIssues = obj.issues || obj.tareas_pendientes || obj.tareas || obj.tasks || [];
  if (!Array.isArray(rawIssues)) {
    console.error('Formato de respuestas inesperado', obj);
    throw new Error('Formato de respuesta inválido: campo de issues no es arreglo');
  }
  return {
    summary: obj.summary || obj.resumen || '',
    issues: rawIssues
  } as AnalysisResponse;
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

    const data = await response.json();
    return normalizeResponse(data);
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

    const data = await response.json();
    return normalizeResponse(data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
