/**
 * fetchWithRetry — wrapper sobre fetch con reintentos automáticos y backoff exponencial.
 * Si la petición falla por error de red o el servidor responde 5xx, reintenta hasta
 * `maxRetries` veces con espera creciente entre intentos.
 *
 * Uso: sustituye `fetch(url, options)` por `fetchWithRetry(url, options)`
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 2,
  baseDelayMs: number = 800
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Reintentamos solo en errores de servidor (5xx), no en 4xx
      if (response.status >= 500 && attempt < maxRetries) {
        lastError = new Error(`Server error ${response.status}`);
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Intento ${attempt + 1} falló (${response.status}). Reintentando en ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (networkError: any) {
      lastError = networkError;

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Error de red en intento ${attempt + 1}. Reintentando en ${delay}ms...`, networkError.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: todos los intentos fallaron');
}
