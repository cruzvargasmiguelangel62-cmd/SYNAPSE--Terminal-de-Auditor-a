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

> **Importante:** la variable `VITE_API_URL` debe contener **solo el origen**
> (protocolo + dominio + puerto opcional). No añadas el path `/api` ni mucho
> menos `/api/analyze` porque el código ya concatena esa ruta; de lo contrario
> terminarás con URLs como
> `https://.../api/analyze/api/analyze` y recibirás 404/HTML.
> Puedes ponerla en blanco para que use `window.location.origin`.
>
> **Validación de datos:** la aplicación ahora comprueba en tiempo de ejecución
> que la respuesta de la API incluye un arreglo `issues`. El servicio también
> normaliza respuestas que utilicen otras claves (por ejemplo
> `tareas_pendientes`, `tareas` o `tasks`), ya que el modelo podría devolver
> nombres en español cuando se le pida generar listas de tareas. Si el backend
> devuelve algo distinto, se mostrará un error controlado en lugar de estrellarse
> con "Cannot read properties of undefined (reading 'map')".

Evita dejar el valor por defecto `http://localhost:4000` en producción, ya que
causa errores de conexión.

## Esquema de la base de datos

El backend usa Supabase para persistir auditorías y hallazgos. La tabla `issues`
se define con estas columnas:

```sql
id BIGSERIAL PRIMARY KEY,
audit_id BIGINT REFERENCES public.audits(id) ON DELETE CASCADE,
external_id INTEGER,          -- importante: descartes de IA
title TEXT NOT NULL,
description TEXT,
category TEXT,
severity TEXT,
fix_plan TEXT,
is_done BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
```

> Si no existe la columna `external_id` el cliente intentará insertarla y
> Supabase devolverá un **400 Bad Request** (nombre de columna no reconocido).
> Puedes añadirla ejecutando en el SQL editor de Supabase:
>
> ```sql
> ALTER TABLE public.issues
>   ADD COLUMN IF NOT EXISTS external_id INTEGER;
> ```

Con la estructura correcta las operaciones de inserción / lectura funcionarán
sin errores.
