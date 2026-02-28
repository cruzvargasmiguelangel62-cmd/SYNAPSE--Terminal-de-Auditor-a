-- ==========================================
-- SYNAPSE AUDIT - SUPABASE SCHEMA SETUP
-- ==========================================

-- 1. TABLA DE CONFIGURACIONES DE USUARIO (BÓVEDA SEGURA)
CREATE TABLE IF NOT EXISTS public.user_configs (
    user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    gh_owner TEXT,
    gh_repo TEXT,
    gh_token TEXT,
    trello_key TEXT,
    trello_token TEXT,
    trello_list_id TEXT,
    gemini_key TEXT,
    groq_key TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en user_configs
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_configs (Solo el dueño puede acceder)
CREATE POLICY "Users can manage their own config" 
    ON public.user_configs 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. TABLA DE AUDITORÍAS (EXISTENTE - ACTUALIZACIÓN DE RLS SI ES NECESARIO)
-- Asegurarse de que el RLS esté habilitado y las políticas sean correctas
-- (Suponiendo que ya existe por el código de MainTerminal)

-- 3. TABLA DE ISSUES (HALLAZGOS)
-- Nota: la aplicación almacena un `external_id` generado por la IA para
-- poder correlacionar los registros. Asegúrate de que la tabla tenga esa
-- columna, de lo contrario las inserciones fallarán con 400 (Bad Request).
--
-- Puedes crear la tabla completa o añadir solamente la columna si ya existe.
--
-- CREATE TABLE IF NOT EXISTS public.issues (
--     id BIGSERIAL PRIMARY KEY,
--     audit_id BIGINT REFERENCES public.audits(id) ON DELETE CASCADE,
--     external_id INTEGER,                          -- identificador externo de la IA
--     title TEXT NOT NULL,
--     description TEXT,
--     category TEXT,
--     severity TEXT,
--     fix_plan TEXT,
--     is_done BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
-- );
--
-- Si ya tienes `issues` pero te falta `external_id`, ejecútalo:
-- ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS external_id INTEGER;

-- Habilitar RLS en issues
-- ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Nota: Ejecute esto en el SQL Editor de Supabase
