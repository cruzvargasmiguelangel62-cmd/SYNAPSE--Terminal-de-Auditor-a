# Architectural Snapshot

Project Context: SYNAPSE--Terminal-de-Auditor-a
Tech Stack: React, TypeScript, Express.js, JavaScript, Database (ORM/ODM), Tailwind CSS, CSS, HTML, Vite
Scale: 25 Analyzed Modules

## Metadata
- Proyecto: SYNAPSE--Terminal-de-Auditor-a
- Archivo: snapshot.md
- Generado en: 20/7/2026, 5:24:57 p.m.
- Modo: deterministic local analysis
- Vigencia: úsalo como mapa de referencia y valida contra el código activo antes de tomar decisiones delicadas.

## Qué Pasarle A Un Agente
- Instrucciones operativas de la tarea actual.
- Este snapshot como contexto base del repositorio.
- Los archivos concretos que el snapshot marca como hotspots o fuentes de verdad.
- No le pases dumps largos de código salvo que la tarea ya esté localizada.

## Lectura de Confianza
- Hechos verificables: entry points detectados, tipos de archivo, relaciones del grafo, conexiones entrantes/salientes, contratos extraídos por regex y métricas de tamaño.
- Heurísticas: fuentes de verdad, flujos críticos, rol inferido del archivo y complejidad estimada.

## Identidad del Proyecto
- Descripción: SYNAPSE--Terminal-de-Auditor-a está orientado a extraer contexto estructural útil desde un repositorio local.
- Resumen arquitectónico: Frontend detectado con 25 archivos principales de interfaz. Se mapearon 28 relaciones entre módulos. Los hotspots más conectados son MainTerminal.tsx (SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx) [11], App.tsx (SYNAPSE--Terminal-de-Auditor-a/App.tsx) [6], types.ts (SYNAPSE--Terminal-de-Auditor-a/types.ts) [6], Auth.tsx (SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx) [4].
- Entry points probables: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/backend/server.js
- Directorios principales: backend, components, services
- Tipos de archivo dominantes: .tsx (12), .ts (8), .js (3), .css (1), .html (1)

## Capacidades Detectadas
- Capacidades base: N/A
- Archivos núcleo: N/A
- Estrategia: análisis determinístico primero y enriquecimiento con IA solo como capa opcional.

## Restricciones de Lectura
- Modelo local-first: no asumir SaaS, multiusuario ni servicio remoto sin evidencia explícita.
- Persistencia: la persistencia detectada es local; no afirmar nube o base de datos de usuarios sin evidencia.
- Regla de inferencia: si una capacidad no aparece en archivos, rutas, dependencias o funciones detectadas, no la inventes.

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

## Flujos Críticos
Esta sección es heurística. No documenta todo el negocio; marca rutas de lectura que suelen cambiar decisiones antes de editar código.

### Autenticación y acceso
- Por qué importa: Conviene empezar aquí si el flujo depende de sesión, permisos o acceso global.
- Archivos guía: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/AuthFooter.tsx, SYNAPSE--Terminal-de-Auditor-a/components/AuthHeader.tsx

### Pagos y bloqueo funcional
- Por qué importa: Conviene revisar estas piezas si el negocio depende de validación, tolerancia, bloqueo o desbloqueo.
- Archivos guía: SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx

### Onboarding o navegación principal
- Por qué importa: Ayuda a reconstruir por dónde entra el usuario y cómo se mueve entre pantallas.
- Archivos guía: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/backend/server.js, SYNAPSE--Terminal-de-Auditor-a/components/Dashboard.tsx, SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx

### Estado global del usuario
- Por qué importa: Útil para detectar dónde vive la información compartida que condiciona la UI.
- Archivos guía: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MicrophoneButton.tsx

## Prioridad de Lectura
1. MainTerminal.tsx (SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx) [11]
2. App.tsx (SYNAPSE--Terminal-de-Auditor-a/App.tsx) [6]
3. types.ts (SYNAPSE--Terminal-de-Auditor-a/types.ts) [6]
4. Auth.tsx (SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx) [4]
5. supabase.ts (SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts) [4]
6. geminiService.ts (SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts) [3]

## Hotspots con Contrato Corto
- MainTerminal.tsx: integración, servicio o capa de acceso; complejidad high; 1856 lineas; exports N/A
- App.tsx: componente, pantalla u orquestador de interfaz; complejidad medium; 82 lineas; exports N/A
- types.ts: módulo de soporte del proyecto; complejidad low; 23 lineas; exports Issue, AnalysisResponse, Category, Provider
- Auth.tsx: componente, pantalla u orquestador de interfaz; complejidad high; 251 lineas; exports N/A
- supabase.ts: módulo de soporte del proyecto trivial (8L, 1 export)
- geminiService.ts: integración, servicio o capa de acceso; complejidad medium; 98 lineas; exports N/A

## Capas y Directorios
- backend
- components
- services

- [ROOT] App.tsx, index.css, index.html, index.tsx, postcss.config.js, tailwind.config.js
- [BACKEND] server.js
- [COMPONENTS] Auth.tsx, AuthFooter.tsx, AuthHeader.tsx, Dashboard.tsx, IssueTable.tsx, KeepAlive.tsx
- [SERVICES] exportService.ts, fetchWithRetry.ts, geminiService.ts, groqService.ts, supabase.ts

## Relaciones Clave Del Grafo
App.tsx -> supabase.ts, App.tsx -> Auth.tsx, App.tsx -> MainTerminal.tsx, App.tsx -> Toast.tsx, App.tsx -> KeepAlive.tsx, Auth.tsx -> supabase.ts, Auth.tsx -> AuthHeader.tsx, Auth.tsx -> AuthFooter.tsx

## Lectura del Grafo
- MainTerminal.tsx: 11 conexiones totales (10 salientes, 1 entrantes). Usa -> supabase.ts, geminiService.ts, groqService.ts, types.ts. Es usado por -> App.tsx.
- App.tsx: 6 conexiones totales (5 salientes, 1 entrantes). Usa -> supabase.ts, Auth.tsx, MainTerminal.tsx, Toast.tsx. Es usado por -> index.tsx.
- types.ts: 6 conexiones totales (0 salientes, 6 entrantes). Usa -> N/A. Es usado por -> IssueTable.tsx, MainTerminal.tsx, PlanningMode.tsx, exportService.ts.
- Auth.tsx: 4 conexiones totales (3 salientes, 1 entrantes). Usa -> supabase.ts, AuthHeader.tsx, AuthFooter.tsx. Es usado por -> App.tsx.
- supabase.ts: 4 conexiones totales (0 salientes, 4 entrantes). Usa -> N/A. Es usado por -> App.tsx, Auth.tsx, KeepAlive.tsx, MainTerminal.tsx.
- geminiService.ts: 3 conexiones totales (2 salientes, 1 entrantes). Usa -> types.ts, fetchWithRetry.ts. Es usado por -> MainTerminal.tsx.
- groqService.ts: 3 conexiones totales (2 salientes, 1 entrantes). Usa -> types.ts, fetchWithRetry.ts. Es usado por -> MainTerminal.tsx.
- IssueTable.tsx: 2 conexiones totales (1 salientes, 1 entrantes). Usa -> types.ts. Es usado por -> MainTerminal.tsx.

## Estructura de Conexiones por Nodo
Este bloque ayuda a explicar cómo se conecta cada archivo crítico dentro del grafo para que otro agente o persona entienda el mapa sin abrir el canvas.

### MainTerminal.tsx
- Archivo: SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
- Centralidad: 0
- Rol inferido: integración, servicio o capa de acceso
- Complejidad estimada: high
- Lineas no vacias: 1856
- Confianza de lectura: high (path+code)
- Contratos detectados: N/A
- Usa directamente: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts, SYNAPSE--Terminal-de-Auditor-a/services/groqService.ts, SYNAPSE--Terminal-de-Auditor-a/types.ts, SYNAPSE--Terminal-de-Auditor-a/components/MicrophoneButton.tsx
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/App.tsx
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx

### App.tsx
- Archivo: SYNAPSE--Terminal-de-Auditor-a/App.tsx
- Centralidad: 0
- Rol inferido: componente, pantalla u orquestador de interfaz
- Complejidad estimada: medium
- Lineas no vacias: 82
- Confianza de lectura: medium (code)
- Contratos detectados: N/A
- Usa directamente: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/index.tsx
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/index.css

### types.ts
- Archivo: SYNAPSE--Terminal-de-Auditor-a/types.ts
- Centralidad: 0
- Rol inferido: módulo de soporte del proyecto
- Complejidad estimada: low
- Lineas no vacias: 23
- Confianza de lectura: medium (path)
- Contratos detectados: Issue, AnalysisResponse, Category, Provider
- Usa directamente: N/A
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx, SYNAPSE--Terminal-de-Auditor-a/components/PlanningMode.tsx, SYNAPSE--Terminal-de-Auditor-a/services/exportService.ts, SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts, SYNAPSE--Terminal-de-Auditor-a/services/groqService.ts, SYNAPSE--Terminal-de-Auditor-a/components/MicrophoneButton.tsx, SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx

### Auth.tsx
- Archivo: SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx
- Centralidad: 0
- Rol inferido: componente, pantalla u orquestador de interfaz
- Complejidad estimada: high
- Lineas no vacias: 251
- Confianza de lectura: medium (code)
- Contratos detectados: N/A
- Usa directamente: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/components/AuthHeader.tsx, SYNAPSE--Terminal-de-Auditor-a/components/AuthFooter.tsx
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/App.tsx
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx

### supabase.ts
- Archivo: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts
- Centralidad: 0
- Rol inferido: módulo de soporte del proyecto
- Complejidad estimada: low
- Lineas no vacias: 8
- Confianza de lectura: medium (path)
- Contratos detectados: N/A
- Usa directamente: N/A
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/App.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx, SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx, SYNAPSE--Terminal-de-Auditor-a/components/Toast.tsx, SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx, SYNAPSE--Terminal-de-Auditor-a/components/AuthHeader.tsx

### geminiService.ts
- Archivo: SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts
- Centralidad: 0
- Rol inferido: integración, servicio o capa de acceso
- Complejidad estimada: medium
- Lineas no vacias: 98
- Confianza de lectura: high (path+code)
- Contratos detectados: N/A
- Usa directamente: SYNAPSE--Terminal-de-Auditor-a/types.ts, SYNAPSE--Terminal-de-Auditor-a/services/fetchWithRetry.ts
- Es usado por: SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
- Impacto secundario probable: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts, SYNAPSE--Terminal-de-Auditor-a/services/groqService.ts, SYNAPSE--Terminal-de-Auditor-a/types.ts, SYNAPSE--Terminal-de-Auditor-a/components/MicrophoneButton.tsx, SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx

