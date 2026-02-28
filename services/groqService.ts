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

export const analyzeIssuesWithGroq = async (
  userInput: string,
  apiKey?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: userInput,
        provider: 'groq',
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

export const generateTasksWithGroq = async (
  userInput: string,
  apiKey?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: userInput,
        provider: 'groq',
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
