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

-- 2.1 DIRECTORIO BÁSICO DE USUARIOS
-- Se usa para validar si el correo ya tiene cuenta antes de compartir auditorías.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own public profile"
    ON public.user_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read user profiles"
    ON public.user_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

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
-- ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assignee_email TEXT;
-- ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS collaborator_note TEXT;

-- Habilitar RLS en issues
-- ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Nota: Ejecute esto en el SQL Editor de Supabase

-- 4. COLABORACIÓN DE AUDITORÍAS
-- Permite compartir una auditoría por correo con otros usuarios autenticados.

CREATE TABLE IF NOT EXISTS public.audit_collaborators (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
    owner_user_id UUID REFERENCES auth.users NOT NULL,
    owner_email TEXT NOT NULL,
    invited_email TEXT NOT NULL,
    access_level TEXT NOT NULL DEFAULT 'editor' CHECK (access_level IN ('editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (audit_id, invited_email)
);

ALTER TABLE public.audit_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage collaborators"
    ON public.audit_collaborators
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Invited users can read their collaboration rows"
    ON public.audit_collaborators
    FOR SELECT
    USING (lower(invited_email) = lower(auth.jwt() ->> 'email'));

-- 5. POLÍTICAS DE ACCESO COMPARTIDO PARA AUDITORÍAS
-- Ajusta o crea políticas equivalentes si ya tienes otras definidas.

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own audits"
    ON public.audits
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Collaborators can read shared audits"
    ON public.audits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.audit_collaborators ac
            WHERE ac.audit_id = audits.id
              AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Collaborators can update shared audits"
    ON public.audits
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.audit_collaborators ac
            WHERE ac.audit_id = audits.id
              AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
              AND ac.access_level = 'editor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.audit_collaborators ac
            WHERE ac.audit_id = audits.id
              AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
              AND ac.access_level = 'editor'
        )
    );

CREATE POLICY "Owners and collaborators can read issues"
    ON public.issues
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.audits a
            WHERE a.id = issues.audit_id
              AND (
                a.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.audit_collaborators ac
                    WHERE ac.audit_id = a.id
                      AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
                )
              )
        )
    );

CREATE POLICY "Owners and editor collaborators can modify issues"
    ON public.issues
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.audits a
            WHERE a.id = issues.audit_id
              AND (
                a.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.audit_collaborators ac
                    WHERE ac.audit_id = a.id
                      AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
                      AND ac.access_level = 'editor'
                )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.audits a
            WHERE a.id = issues.audit_id
              AND (
                a.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.audit_collaborators ac
                    WHERE ac.audit_id = a.id
                      AND lower(ac.invited_email) = lower(auth.jwt() ->> 'email')
                      AND ac.access_level = 'editor'
                )
              )
        )
    );
