# System View: SYNAPSE--Terminal-de-Auditor-a

## Lectura de Confianza
- Hechos verificables: capas listadas desde rutas reales y relaciones extraídas del grafo.
- Heurísticas: roles inferidos y lecturas semánticas cortas para acelerar onboarding.

## Capas Detectadas
- [backend]: server.js
- [components]: Auth.tsx, AuthFooter.tsx, AuthHeader.tsx, Dashboard.tsx, IssueTable.tsx, KeepAlive.tsx, MainTerminal.tsx, MicrophoneButton.tsx, PlanningMode.tsx, Toast.tsx
- [root]: App.tsx, index.css, index.html, index.tsx, postcss.config.js, tailwind.config.js, types.ts, vite-env.d.ts, vite.config.ts
- [services]: exportService.ts, fetchWithRetry.ts, geminiService.ts, groqService.ts, supabase.ts

## Módulos Más Conectados
- MainTerminal.tsx: 11 conexiones (10 salientes, 1 entrantes)
  Usa -> supabase.ts, geminiService.ts, groqService.ts, types.ts
  Es usado por -> App.tsx
- App.tsx: 6 conexiones (5 salientes, 1 entrantes)
  Usa -> supabase.ts, Auth.tsx, MainTerminal.tsx, Toast.tsx
  Es usado por -> index.tsx
- types.ts: 6 conexiones (0 salientes, 6 entrantes)
  Usa -> N/A
  Es usado por -> IssueTable.tsx, MainTerminal.tsx, PlanningMode.tsx, exportService.ts
- Auth.tsx: 4 conexiones (3 salientes, 1 entrantes)
  Usa -> supabase.ts, AuthHeader.tsx, AuthFooter.tsx
  Es usado por -> App.tsx
- supabase.ts: 4 conexiones (0 salientes, 4 entrantes)
  Usa -> N/A
  Es usado por -> App.tsx, Auth.tsx, KeepAlive.tsx, MainTerminal.tsx
- geminiService.ts: 3 conexiones (2 salientes, 1 entrantes)
  Usa -> types.ts, fetchWithRetry.ts
  Es usado por -> MainTerminal.tsx
- groqService.ts: 3 conexiones (2 salientes, 1 entrantes)
  Usa -> types.ts, fetchWithRetry.ts
  Es usado por -> MainTerminal.tsx
- IssueTable.tsx: 2 conexiones (1 salientes, 1 entrantes)
  Usa -> types.ts
  Es usado por -> MainTerminal.tsx
- KeepAlive.tsx: 2 conexiones (1 salientes, 1 entrantes)
  Usa -> supabase.ts
  Es usado por -> App.tsx
- PlanningMode.tsx: 2 conexiones (1 salientes, 1 entrantes)
  Usa -> types.ts
  Es usado por -> MainTerminal.tsx

## Flujos de Dependencia
- App.tsx -> supabase.ts
- App.tsx -> Auth.tsx
- App.tsx -> MainTerminal.tsx
- App.tsx -> Toast.tsx
- App.tsx -> KeepAlive.tsx
- Auth.tsx -> supabase.ts
- Auth.tsx -> AuthHeader.tsx
- Auth.tsx -> AuthFooter.tsx
- IssueTable.tsx -> types.ts
- KeepAlive.tsx -> supabase.ts
- MainTerminal.tsx -> supabase.ts
- MainTerminal.tsx -> geminiService.ts
- MainTerminal.tsx -> groqService.ts
- MainTerminal.tsx -> types.ts
- MainTerminal.tsx -> MicrophoneButton.tsx
- MainTerminal.tsx -> IssueTable.tsx
- MainTerminal.tsx -> Toast.tsx
- MainTerminal.tsx -> exportService.ts
- MainTerminal.tsx -> Dashboard.tsx
- MainTerminal.tsx -> PlanningMode.tsx
