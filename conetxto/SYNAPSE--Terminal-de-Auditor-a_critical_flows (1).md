# Critical Flows: SYNAPSE--Terminal-de-Auditor-a

## Metadata
- Proyecto: SYNAPSE--Terminal-de-Auditor-a
- Archivo: critical_flows.md
- Generado en: 20/7/2026, 5:25:12 p.m.
- Modo: deterministic local analysis
- Vigencia: úsalo como mapa de referencia y valida contra el código activo antes de tomar decisiones delicadas.

## Qué Es Este Archivo
Documento corto para separar flujos operativos y fuentes de verdad del resto del mapa técnico.

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

## Recomendación de Uso
- Léelo antes de editar si la tarea toca reglas funcionales, contexto global o integraciones.
- Cruza este archivo con snapshot y graph guide si necesitas más detalle estructural.
