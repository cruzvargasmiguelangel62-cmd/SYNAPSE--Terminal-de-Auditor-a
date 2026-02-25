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
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu correo para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setLoginSuccess(true);
                setTimeout(() => { onLoginSuccess(); }, 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            if (!loginSuccess) setLoading(false);
        }
    };

    if (!supabase) return (
        <div className="flex items-center justify-center min-h-screen bg-[#060810]">
            <div className="text-red-500 p-8 text-center font-bold uppercase tracking-widest text-sm">
                Error: Nuclear Core Offline
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen min-h-dvh bg-[#060810] text-slate-200 px-4 py-8 sm:py-12 relative overflow-hidden">

            {/* Grid overlay texture */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Radial gradient vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.12),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />

            {/* Corner accents — hidden on tiny screens */}
            <div className="hidden sm:block absolute top-6 left-6 md:top-8 md:left-8 w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-sky-500/30 rounded-tl-lg pointer-events-none" />
            <div className="hidden sm:block absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 md:w-16 md:h-16 border-t-2 border-r-2 border-sky-500/30 rounded-tr-lg pointer-events-none" />
            <div className="hidden sm:block absolute bottom-6 left-6 md:bottom-8 md:left-8 w-12 h-12 md:w-16 md:h-16 border-b-2 border-l-2 border-sky-500/30 rounded-bl-lg pointer-events-none" />
            <div className="hidden sm:block absolute bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-sky-500/30 rounded-br-lg pointer-events-none" />

            {/* Floating orbs */}
            <div className="absolute top-[15%] left-[10%] w-48 h-48 sm:w-72 sm:h-72 bg-sky-500 rounded-full filter blur-[120px] sm:blur-[140px] opacity-[0.07] animate-blob pointer-events-none" />
            <div className="absolute top-[55%] right-[8%] w-56 h-56 sm:w-80 sm:h-80 bg-indigo-500 rounded-full filter blur-[120px] sm:blur-[140px] opacity-[0.06] animate-blob animation-delay-2000 pointer-events-none" />
            <div className="absolute bottom-[10%] left-[35%] w-44 h-44 sm:w-64 sm:h-64 bg-cyan-400 rounded-full filter blur-[120px] sm:blur-[140px] opacity-[0.05] animate-blob animation-delay-4000 pointer-events-none" />

            {/* Scanline shimmer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/[0.015] to-transparent animate-scan" />
            </div>

            {/* ── Success Overlay ── */}
            {loginSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none bg-[#060810]/70 backdrop-blur-md animate-in fade-in duration-500 px-4">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(16,185,129,0.08),transparent)]" />

                    <div className="text-center relative w-full max-w-xs sm:max-w-sm">
                        {/* Concentric rings */}
                        <div className="absolute -inset-16 sm:-inset-24 flex items-center justify-center">
                            <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-emerald-500/5 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                        </div>

                        {/* Lock icon */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-10">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl animate-pulse" />
                            <div className="relative w-full h-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 10V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <rect x="5" y="10" width="14" height="12" rx="3" fill="currentColor" stroke="currentColor" strokeWidth="1" className="opacity-30" />
                                    <rect x="5" y="10" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" className="opacity-80" />
                                    <circle cx="12" cy="15" r="1.5" fill="#064e3b" />
                                    <path d="M12 16.5V18" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                            <div className="font-mono text-[9px] text-emerald-500/50 uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-3 sm:mb-4">// 200 OK</div>
                            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter">
                                Acceso <span className="text-emerald-400">Concedido</span>
                            </h2>
                            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-2">Sincronización de Núcleo Completa</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main card ── */}
            <div
                className={`
                    w-full max-w-[420px] relative transition-all duration-700
                    ${loginSuccess ? 'scale-90 opacity-0 blur-lg' : 'scale-100 opacity-100'}
                `}
            >
                {/* Glow border */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-sky-500/20 via-transparent to-indigo-500/10 pointer-events-none" />
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-slate-700/30 to-transparent opacity-50 pointer-events-none" />

                <div className="relative bg-[#0c0f1a]/90 border border-slate-800/60 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden">

                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
                    <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-sky-400/20 blur-sm" />

                    {/* Inner corner dots */}
                    <div className="absolute top-3 left-3 w-1 h-1 rounded-full bg-sky-500/40" />
                    <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-sky-500/40" />

                    {/* Padding adapts: compact on mobile, generous on larger */}
                    <div className="p-5 sm:p-8">

                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-6 sm:mb-8 px-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.25em] sm:tracking-[0.3em]">Sistema Activo</span>
                            </div>
                            <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">v2.4.1</span>
                        </div>

                        <AuthHeader />

                        <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5 mt-6 sm:mt-8">

                            {/* Email field */}
                            <div className="group">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] sm:tracking-[0.3em] block mb-1.5 sm:mb-2 pl-1 group-focus-within:text-sky-400/70 transition-colors">
                                    Identidad Digital
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500/70 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800/70 rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-sm text-slate-200 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 focus:bg-sky-950/10 outline-none transition-all placeholder:text-slate-700 font-mono"
                                        placeholder="usuario@synapse.com"
                                        autoComplete="email"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-sky-400 group-focus-within:w-full transition-all duration-500 rounded-full" />
                                </div>
                            </div>

                            {/* Password field */}
                            <div className="group">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] sm:tracking-[0.3em] block mb-1.5 sm:mb-2 pl-1 group-focus-within:text-sky-400/70 transition-colors">
                                    Clave de Encriptación
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500/70 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800/70 rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-sm text-slate-200 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 focus:bg-sky-950/10 outline-none transition-all placeholder:text-slate-700 font-mono"
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-sky-400 group-focus-within:w-full transition-all duration-500 rounded-full" />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-red-950/40 border border-red-500/20 rounded-xl animate-in shake duration-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse mt-0.5" />
                                    <p className="text-red-400/90 text-[11px] font-mono font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            {/* Message */}
                            {message && (
                                <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-emerald-400/90 text-[11px] font-mono font-medium leading-relaxed">{message}</p>
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-1 sm:mt-2 py-3.5 sm:py-4 relative bg-sky-600 text-white font-bold text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] rounded-xl hover:bg-sky-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden group shadow-lg shadow-sky-900/40"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-60 rounded-xl" />

                                <span className="relative flex items-center justify-center gap-2.5">
                                    {loading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sincronizando...
                                        </>
                                    ) : (
                                        <>
                                            {isSignUp ? 'Crear Nueva Identidad' : 'Desbloquear Terminal'}
                                            <svg className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
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

                    {/* Bottom corner dots */}
                    <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-slate-700/60" />
                    <div className="absolute bottom-3 right-3 w-1 h-1 rounded-full bg-slate-700/60" />
                </div>
            </div>

            <AuthFooter isSignUp={isSignUp} onToggle={() => { }} />
        </div>
    );
};