import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Auth } from './components/Auth';
import { MainTerminal } from './components/MainTerminal';
import { ToastProvider } from './components/Toast';
import KeepAlive from './components/KeepAlive';
import { Session } from '@supabase/supabase-js';

// Componente Wrapper para proporcionar el contexto global
const AppWrapper = () => (
  <ToastProvider>
    <KeepAlive />
    <App />
  </ToastProvider>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Gestión de la Sesión de Supabase
  useEffect(() => {
    if (supabase) {
      // 1. Obtener sesión actual inicial
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsSessionLoading(false);
      });

      // 2. Escuchar cambios en el estado de autenticación
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setIsSessionLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setIsSessionLoading(false);
    }
  }, []);

  // Pantalla de Carga Inicial
  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-slate-200">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-[4px] border-sky-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-[4px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] mono text-slate-500 font-bold uppercase tracking-[0.3em] animate-pulse">Iniciando Synapse QA...</p>
      </div>
    );
  }

  // Si no hay sesión, mostrar el Login (Auth)
  if (!session) {
    return <Auth onLoginSuccess={() => { }} />; // El onAuthStateChange manejará la redirección
  }

  // Si hay sesión, mostrar la Terminal Principal
  return <MainTerminal session={session} />;
};

export default AppWrapper;
