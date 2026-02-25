import { useEffect } from 'react';
import { supabase } from '../services/supabase';

/**
 * KeepAlive Component
 * 
 * Este componente envía un "pulso" a Supabase y al Servidor Backend (Render) 
 * para evitar que entren en modo de pausa por inactividad.
 */
export default function KeepAlive() {
    useEffect(() => {
        // Render Free suspende la app tras 15 MINUTOS de inactividad.
        // Usamos 10 minutos para estar seguros mientras el usuario tenga la pestaña abierta.
        const RENDER_INTERVAL = 10 * 60 * 1000;

        // Supabase Free pausa el proyecto tras 7 DÍAS de inactividad.
        // Un pulso cada 24 horas es más que suficiente para esto.
        const SUPABASE_INTERVAL = 24 * 60 * 60 * 1000;

        const sendRenderPulse = async () => {
            try {
                // Hacemos una petición al Backend para mantenerlo despierto
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                
                // Intentamos el endpoint /health que definimos en backend/server.js
                await fetch(`${apiBaseUrl}/health`, { mode: 'no-cors' }).catch(() => {
                    // Si falla, intentamos la raíz
                    fetch(`${apiBaseUrl}/`, { mode: 'no-cors' }).catch(() => { });
                });
                
                console.log(`[KeepAlive] Pulso a Render enviado - ${new Date().toLocaleTimeString()}`);
            } catch (err) {
                // Ignoramos errores de red, lo importante es el intento de conexión
            }
        };

        const sendSupabasePulse = async () => {
            try {
                if (!supabase) return;
                
                // Una consulta simple a la tabla 'audits' que sabemos que existe
                await supabase.from('audits').select('id').limit(1);
                console.log(`[KeepAlive] Pulso a Supabase exitoso - ${new Date().toLocaleTimeString()}`);
            } catch (err: any) {
                console.warn('[KeepAlive] Error en pulso Supabase:', err.message);
            }
        };

        // Ejecutar inmediatamente al montar
        sendRenderPulse();
        sendSupabasePulse();

        // Configurar intervalos
        const renderTimer = setInterval(sendRenderPulse, RENDER_INTERVAL);
        const supabaseTimer = setInterval(sendSupabasePulse, SUPABASE_INTERVAL);

        return () => {
            clearInterval(renderTimer);
            clearInterval(supabaseTimer);
        };
    }, []);

    // Este componente no renderiza nada visualmente
    return null;
}
