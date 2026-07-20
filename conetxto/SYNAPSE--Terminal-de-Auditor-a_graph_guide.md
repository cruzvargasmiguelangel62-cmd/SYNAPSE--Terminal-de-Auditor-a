# Graph Guide: SYNAPSE--Terminal-de-Auditor-a

## Metadata
- Proyecto: SYNAPSE--Terminal-de-Auditor-a
- Archivo: graph_guide.md
- Generado en: 20/7/2026, 5:25:12 p.m.
- Modo: deterministic local analysis
- Vigencia: úsalo como mapa de referencia y valida contra el código activo antes de tomar decisiones delicadas.

## Cómo Leer Este Archivo
- "Usa" significa que un archivo depende de otro.
- "Recibe uso de" significa que otros módulos dependen de ese archivo.
- Los módulos listados primero son los más relevantes para entender el flujo real del proyecto.

## Resumen del Grafo
- Nodos: 25
- Relaciones: 28
- Módulos más conectados: MainTerminal.tsx (11), App.tsx (6), types.ts (6), Auth.tsx (4), supabase.ts (4), geminiService.ts (3), groqService.ts (3), IssueTable.tsx (2)

## Fuentes de Verdad
Esta sección es heurística. Señala archivos donde probablemente viven decisiones reales del sistema según ruta, nombre y señales del código.
- Reglas de negocio: SYNAPSE--Terminal-de-Auditor-a/backend/server.js, SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
  Nota: Aquí suelen vivir decisiones funcionales, validaciones y cálculo de estados.
- Estado global y contexto: SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx
  Nota: Aquí suele vivir el acceso global, la sesión y la propagación de estado.
- Integraciones y API: SYNAPSE--Terminal-de-Auditor-a/backend/server.js, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
  Nota: Aquí suelen vivir llamadas externas, endpoints y capa de integración.
- UI y orquestación: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Dashboard.tsx
  Nota: Aquí suelen vivir pantallas, flujos visibles y orquestadores de interfaz.
- Autenticación y acceso: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/backend/server.js, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx
  Nota: Aquí suele vivir el control de acceso, sesión y reglas de identidad.

## Archivos Orquestadores
- MainTerminal.tsx
  Path: SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
  Usa: supabase.ts, geminiService.ts, groqService.ts, types.ts, MicrophoneButton.tsx, IssueTable.tsx, Toast.tsx, exportService.ts
  Recibe uso de: App.tsx
- App.tsx
  Path: SYNAPSE--Terminal-de-Auditor-a/App.tsx
  Usa: supabase.ts, Auth.tsx, MainTerminal.tsx, Toast.tsx, KeepAlive.tsx
  Recibe uso de: index.tsx
- Auth.tsx
  Path: SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx
  Usa: supabase.ts, AuthHeader.tsx, AuthFooter.tsx
  Recibe uso de: App.tsx
- geminiService.ts
  Path: SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts
  Usa: types.ts, fetchWithRetry.ts
  Recibe uso de: MainTerminal.tsx
- groqService.ts
  Path: SYNAPSE--Terminal-de-Auditor-a/services/groqService.ts
  Usa: types.ts, fetchWithRetry.ts
  Recibe uso de: MainTerminal.tsx
- index.tsx
  Path: SYNAPSE--Terminal-de-Auditor-a/index.tsx
  Usa: App.tsx, index.css
  Recibe uso de: Nadie

## Núcleo Compartido
- types.ts
  Path: SYNAPSE--Terminal-de-Auditor-a/types.ts
  Recibe uso de: IssueTable.tsx, MainTerminal.tsx, PlanningMode.tsx, exportService.ts, geminiService.ts, groqService.ts
  Usa: Nadie
- supabase.ts
  Path: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts
  Recibe uso de: App.tsx, Auth.tsx, KeepAlive.tsx, MainTerminal.tsx
  Usa: Nadie
- Toast.tsx
  Path: SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx
  Recibe uso de: App.tsx, MainTerminal.tsx
  Usa: Nadie
- fetchWithRetry.ts
  Path: SYNAPSE--Terminal-de-Auditor-a/services/fetchWithRetry.ts
  Recibe uso de: geminiService.ts, groqService.ts
  Usa: Nadie

## Recomendación Para Otro Agente
Empieza por los archivos orquestadores, luego revisa el núcleo compartido y por último entra a archivos hoja. Este orden reduce tokens y acelera el entendimiento del sistema.
