# SYNAPSE-Terminal-de-Auditor-a

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yCuYzxPAqH4OEFsGfQECK8ad7BoAhU2T

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file at the root (you can copy `.env.example` once created) and define:
   ```
   GEMINI_API_KEY=tu_clave_gemini_aqui
   GROQ_API_KEY=si_usas_groq
   # opcional: si quieres que el cliente apunte a un backend distinto
   VITE_API_URL=http://localhost:4000
   ```
3. Start el servidor backend (desde la carpeta `backend`):
   ```bash
   cd backend && npm install && npm run start
   ```
4. Ejecuta el frontend:
   ```bash
   npm run dev
   ```

El cliente por defecto intentará comunicarse con el mismo host/puerto del cual
se sirve. Si necesitas apuntar a un servidor remoto, define `VITE_API_URL`.

## Deployment

La aplicación está diseñada para que el backend Express sirva los archivos
estáticos generados por Vite. En Render u otro proveedor, asegúrate de lo
siguiente:

1. Configura las variables de entorno en el panel del servicio:
   - `GEMINI_API_KEY` (y `GROQ_API_KEY` si aplica)
   - `VITE_API_URL` **opcional**; si lo dejas vacío, el frontend usará
     `window.location.origin`, lo cual funciona cuando el backend y el client
     comparten dominio (como al usar `express.static`).
2. En el flujo de build, el comando `npm run build` debe ejecutarse en la raíz,
   generando `dist/` que el servidor Express sirve.
3. Tras hacer un push a GitHub, Render detecta el cambio y redeploya
   automáticamente.

Si el cliente se carga desde `https://synapse-terminal-de-auditor-a.onrender.com`,
las llamadas a la API irán a `https://synapse-terminal-de-auditor-a.onrender.com/api/*`.
Evita dejar el valor por defecto `http://localhost:4000` en producción, ya que
causa errores de conexión.
