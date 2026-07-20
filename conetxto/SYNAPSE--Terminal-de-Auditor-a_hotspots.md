# Hotspots & Deuda Técnica: SYNAPSE--Terminal-de-Auditor-a

## Hotspots Prioritarios
1. MainTerminal.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/components/MainTerminal.tsx
   Importancia: 11
   Tipo: .tsx
   Rol: integración, servicio o capa de acceso
   Complejidad estimada: high
   Lineas no vacias: 1856
   Confianza: high (path+code)
   Contratos detectados: N/A
2. App.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/App.tsx
   Importancia: 6
   Tipo: .tsx
   Rol: componente, pantalla u orquestador de interfaz
   Complejidad estimada: medium
   Lineas no vacias: 82
   Confianza: medium (code)
   Contratos detectados: N/A
3. types.ts
   Path: SYNAPSE--Terminal-de-Auditor-a/types.ts
   Importancia: 6
   Tipo: .ts
   Rol: módulo de soporte del proyecto
   Complejidad estimada: low
   Lineas no vacias: 23
   Confianza: medium (path)
   Contratos detectados: Issue, AnalysisResponse, Category, Provider
4. Auth.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/components/Auth.tsx
   Importancia: 4
   Tipo: .tsx
   Rol: componente, pantalla u orquestador de interfaz
   Complejidad estimada: high
   Lineas no vacias: 251
   Confianza: medium (code)
   Contratos detectados: N/A
5. supabase.ts
   Path: SYNAPSE--Terminal-de-Auditor-a/services/supabase.ts
   Importancia: 4
   Tipo: .ts
   Rol: módulo de soporte del proyecto
   Complejidad estimada: low
   Lineas no vacias: 8
   Confianza: medium (path)
   Contratos detectados: N/A
6. geminiService.ts
   Path: SYNAPSE--Terminal-de-Auditor-a/services/geminiService.ts
   Importancia: 3
   Tipo: .ts
   Rol: integración, servicio o capa de acceso
   Complejidad estimada: medium
   Lineas no vacias: 98
   Confianza: high (path+code)
   Contratos detectados: N/A
7. groqService.ts
   Path: SYNAPSE--Terminal-de-Auditor-a/services/groqService.ts
   Importancia: 3
   Tipo: .ts
   Rol: integración, servicio o capa de acceso
   Complejidad estimada: medium
   Lineas no vacias: 103
   Confianza: high (path+code)
   Contratos detectados: N/A
8. IssueTable.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/components/IssueTable.tsx
   Importancia: 2
   Tipo: .tsx
   Rol: componente, pantalla u orquestador de interfaz
   Complejidad estimada: high
   Lineas no vacias: 285
   Confianza: medium (code)
   Contratos detectados: N/A
9. KeepAlive.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/components/KeepAlive.tsx
   Importancia: 2
   Tipo: .tsx
   Rol: integración, servicio o capa de acceso
   Complejidad estimada: low
   Lineas no vacias: 58
   Confianza: high (path+code)
   Contratos detectados: default KeepAlive()
10. PlanningMode.tsx
   Path: SYNAPSE--Terminal-de-Auditor-a/components/PlanningMode.tsx
   Importancia: 2
   Tipo: .tsx
   Rol: componente, pantalla u orquestador de interfaz
   Complejidad estimada: high
   Lineas no vacias: 469
   Confianza: medium (code)
   Contratos detectados: N/A

## Recomendaciones de Acción
- Revisa primero los archivos con más conexiones entrantes: suelen ser utilidades compartidas o núcleos frágiles.
- Revisa luego los archivos con más conexiones salientes: suelen ser orquestadores o pantallas con demasiadas responsabilidades.
- Antes de refactorizar, sigue las relaciones del grafo para evitar romper cadenas de dependencias ocultas.
