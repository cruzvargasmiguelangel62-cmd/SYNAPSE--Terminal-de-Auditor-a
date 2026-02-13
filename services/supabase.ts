import { createClient } from '@supabase/supabase-js';

// Inicialización resiliente de Supabase
// Utilizamos una única instancia para evitar advertencias de múltiples clientes GoTrue
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
