import React, { createContext, useContext, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000); // 4 segundos de duración
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md transform transition-all duration-300 animate-[slide-in-right_0.4s_ease-out] hover:scale-[1.02]
              ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200' : ''}
              ${toast.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' : ''}
              ${toast.type === 'info' ? 'bg-slate-900/80 border-sky-500/30 text-sky-200' : ''}
              ${toast.type === 'warning' ? 'bg-amber-950/80 border-amber-500/30 text-amber-200' : ''}
            `}
                        role="alert"
                    >
                        <span className="text-lg">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'info' && '🤖'}
                            {toast.type === 'warning' && '⚠️'}
                        </span>
                        <div>
                            <p className="text-[12px] font-bold uppercase tracking-wider">{toast.type === 'success' ? 'Operación Exitosa' : toast.type === 'error' ? 'Error del Sistema' : 'Synapse Info'}</p>
                            <p className="text-[13px] font-medium leading-tight opacity-90">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 opacity-50 hover:opacity-100 text-lg leading-none"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
