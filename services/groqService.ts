import { AnalysisResponse, Severity } from "../types";

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

// helper that converts various severity strings into our enum
const normalizeSeverity = (raw: any): Severity => {
  if (!raw) return Severity.LOW;
  const s = String(raw).toLowerCase();
  if (s.includes('high') || s.includes('alta')) return Severity.HIGH;
  if (s.includes('med') || s.includes('media')) return Severity.MEDIUM;
  return Severity.LOW;
};

const normalizeResponse = (obj: any) => {
  if (!obj) throw new Error('Respuesta vacía del servidor');
  const rawIssues = obj.issues || obj.tareas_pendientes || obj.tareas || obj.tasks || [];
  if (!Array.isArray(rawIssues)) {
    console.error('Formato de respuestas inesperado', obj);
    throw new Error('Formato de respuesta inválido: campo de issues no es arreglo');
  }

  const issues = rawIssues.map((i: any) => {
    const title = i.title || i.titulo || i.descripcion || i.description || '';
    const desc = i.desc || i.descripcion || i.detalles || i.detail || '';
    const category = i.category || i.categoria || undefined;
    const fix = i.fix || i.resolucion || i.plan_tecnico || i.plan_accion || i.plan || '';
    const rawSeverity = i.severity || i.prioridad || i.gravedad || i.level || undefined;

    return {
      ...i,
      title,
      desc,
      category,
      severity: normalizeSeverity(rawSeverity),
      fix
    };
  });

  return {
    summary: obj.summary || obj.resumen || '',
    issues
  } as AnalysisResponse;
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

    const data = await response.json();
    return normalizeResponse(data);
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

    const data = await response.json();
    return normalizeResponse(data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
