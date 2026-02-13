import React from 'react';

interface AuthFooterProps {
    isSignUp: boolean;
    onToggle: () => void;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ isSignUp, onToggle }) => (
    <div className="mt-8 text-center opacity-40">
        <p className="text-[9px] mono text-slate-600 uppercase tracking-widest">
            System Status: Operational
        </p>
        <div className="flex justify-center gap-1 mt-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
        </div>
    </div>
);

interface AuthToggleProps {
    isSignUp: boolean;
    onToggle: () => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({ isSignUp, onToggle }) => (
    <div className="mt-6 text-center border-t border-slate-800/50 pt-4">
        <p className="text-xs text-slate-500">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿Nuevo usuario?'}
            <button
                onClick={onToggle}
                className="ml-2 text-sky-500 font-bold hover:text-sky-400 transition-colors uppercase text-[10px] tracking-wider"
            >
                {isSignUp ? 'Ingresar' : 'Crear Cuenta'}
            </button>
        </p>
    </div>
);
