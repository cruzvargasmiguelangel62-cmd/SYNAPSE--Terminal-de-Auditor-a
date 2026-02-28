require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- PROXY IA ---

// Instrucciones para Gemini
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
5. Para cada tarea incluye campos claramente nombrados: `title` (resumen breve), `desc` (detalle del trabajo), una breve `fix` o `plan_tecnico` con la sugerencia de resolución técnica y, si aplica, `category` y `severity`.
6. Estructura de salida JSON.
RESPONDE SIEMPRE EN ESPAÑOL.`;

// Endpoint de análisis de issues
app.post('/api/analyze', async (req, res) => {
  const { input, provider, apiKey, isTask } = req.body;

  // Usar la key del body (del usuario) o la del servidor (.env)
  const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const groqKey = apiKey || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  try {
    if (provider === 'gemini') {
      if (!geminiKey) return res.status(400).json({ error: 'Falta Gemini API Key' });

      const genAI = new GoogleGenAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: isTask ? TASK_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION
      });

      const result = await model.generateContent(input);
      const response = await result.response;
      let text = response.text();

      // Limpiar markdown si Gemini lo envía
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      res.json(JSON.parse(text));

    } else if (provider === 'groq') {
      if (!groqKey) return res.status(400).json({ error: 'Falta Groq API Key' });

      const systemPrompt = isTask ? "Eres un Gestor de Tareas experto. Transforma la entrada en una lista de tareas pendientes. Responde SOLO con JSON." : "Eres un Auditor de Software Senior. Analiza el reporte y devuelve un JSON estructurado. Responde en Español.";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      res.json(JSON.parse(data.choices[0].message.content));
    } else {
      res.status(400).json({ error: 'Proveedor no válido' });
    }
  } catch (error) {
    console.error('Error en Proxy IA:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- FIN PROXY IA ---

// --- ENDPOINTS DE EXPORTACIÓN (GITHUB & TRELLO) ---

// Exportar a GitHub Issues
app.post('/api/export/github', async (req, res) => {
  const { owner, repo, token, title, body } = req.body;

  if (!owner || !repo || !token || !title) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para GitHub' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Synapse-QA-App'
      },
      body: JSON.stringify({ title, body })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error en la API de GitHub');

    res.json({ success: true, url: data.html_url });
  } catch (error) {
    console.error('GitHub Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar token de GitHub
app.post('/api/verify/github', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Falta el token' });

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Synapse-QA-App'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Token inválido');
    res.json({ success: true, user: data.login });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Exportar a Trello Cards
app.post('/api/export/trello', async (req, res) => {
  const { key, token, idList, name, desc } = req.body;

  if (!key || !token || !idList || !name) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para Trello' });
  }

  try {
    const url = `https://api.trello.com/1/cards?idList=${idList}&key=${key}&token=${token}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}`;

    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();

    if (!response.ok) throw new Error(data || 'Error en la API de Trello');

    res.json({ success: true, url: data.shortUrl });
  } catch (error) {
    console.error('Trello Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar credenciales de Trello
app.post('/api/verify/trello', async (req, res) => {
  const { key, token } = req.body;
  if (!key || !token) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    const response = await fetch(`https://api.trello.com/1/members/me?key=${key}&token=${token}`);
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data === 'string' ? data : 'Credenciales inválidas');
    res.json({ success: true, user: data.fullName });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
