import React from 'react';

export const AuthHeader: React.FC = () => (
    <div className="text-center mb-8">
        <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-sky-500/20 mx-auto mb-4 text-xl">
            S
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
            Synapse <span className="text-sky-500 font-light">Access</span>
        </h1>
        <p className="text-[10px] mono text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
            Secure Gateway // Auth v1.0
        </p>
    </div>
);
