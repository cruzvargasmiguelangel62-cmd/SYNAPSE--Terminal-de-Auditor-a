
export enum Severity {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja'
}

export type Category = 'UI/UX' | 'Backend' | 'Datos' | 'Seguridad' | 'Rendimiento';

export type Provider = 'gemini' | 'groq';

export interface Issue {
  dbId?: string; // UUID de Supabase
  id: number;    // ID de la IA (externo)
  title: string;
  desc: string;
  category: Category;
  severity: Severity;
  fix: string;
  isDone?: boolean;
}

export interface AnalysisResponse {
  summary: string;
  issues: Issue[];
}
