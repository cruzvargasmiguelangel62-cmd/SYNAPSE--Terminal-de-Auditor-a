import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { AuthHeader } from './AuthHeader';
import { AuthFooter, AuthToggle } from './AuthFooter';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu correo para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Animación de éxito antes de entrar
                setLoginSuccess(true);
                setTimeout(() => {
                    onLoginSuccess();
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            if (!loginSuccess) setLoading(false);
        }
    };

    if (!supabase) return <div className="text-red-500 p-8 text-center font-bold uppercase tracking-widest">Error: Nuclear Core Offline</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-slate-200 p-4 relative overflow-hidden">

            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-10 w-96 h-96 bg-sky-500 rounded-full filter blur-[120px] opacity-30 animate-blob"></div>
            <div className="absolute top-1/4 -right-10 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-25 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-10 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-[120px] opacity-20 animate-blob animation-delay-4000"></div>

            {/* Success Overlay Animation */}
            {loginSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none bg-[#0a0c10]/60 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="absolute w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] animate-pulse"></div>

                    <div className="text-center relative">
                        {/* Custom Padlock SVG */}
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <svg className="w-full h-full text-emerald-500 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Shackle (Upper Part) - Animated */}
                                <path
                                    className="animate-lock-shackle"
                                    d="M7 10V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V10"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                                {/* Lock Body (Lower Part) */}
                                <rect
                                    x="5" y="10" width="14" height="12" rx="3"
                                    fill="currentColor"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                />
                                {/* Keyhole */}
                                <circle cx="12" cy="15" r="1.5" fill="#064e3b" />
                                <path d="M12 16.5V18" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>

                        <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter sm:text-5xl">
                                Acceso <span className="text-emerald-500">Concedido</span>
                            </h2>
                            <p className="text-sky-400/60 font-mono text-[10px] uppercase tracking-[0.4em]">Sincronización de Núcleo Completa</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-md bg-slate-900/40 border border-slate-800/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-700 ${loginSuccess ? 'scale-90 opacity-0 blur-lg' : 'scale-100 opacity-100'}`}>

                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>

                <AuthHeader />

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Identidad Digital</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-4 text-sm text-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all placeholder:text-slate-700"
                            placeholder="usuario@synapse.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Clave de Encriptación</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-4 text-sm text-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all placeholder:text-slate-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold text-center">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-sky-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                        {loading ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sincronizando...
                            </span>
                        ) : (
                            isSignUp ? 'Crear Nueva Identidad' : 'Desbloquear Terminal'
                        )}
                    </button>
                </form>

                <AuthToggle
                    isSignUp={isSignUp}
                    onToggle={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                        setMessage(null);
                    }}
                />
            </div>

            <AuthFooter isSignUp={isSignUp} onToggle={() => { }} />
        </div>
    );
};
