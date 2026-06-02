import * as React from 'react';
import { useMemo } from 'react';

interface AuditRecord {
    id: string | number;
    summary: string;
    created_at: string;
    isCompleted: boolean;
    totalIssues: number;
    completedIssues: number;
    isOwner: boolean;
    issues?: any[];
}

interface DashboardProps {
    audits: AuditRecord[];
    onClose: () => void;
}

// Mini bar chart usando CSS puro
const BarChart: React.FC<{ data: { label: string; value: number; color: string }[]; max: number }> = ({ data, max }) => (
    <div className="space-y-2">
        {data.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0 truncate">{label}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%', backgroundColor: color }}
                    />
                </div>
                <span className="text-[11px] font-black text-slate-300 w-6 text-right shrink-0">{value}</span>
            </div>
        ))}
    </div>
);

// Donut chart SVG puro
const DonutChart: React.FC<{ resolved: number; total: number }> = ({ resolved, total }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const pct = total > 0 ? resolved / total : 0;
    const offset = circumference * (1 - pct);
    const color = pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke={color} strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="absolute text-center">
                <p className="text-2xl font-black text-white">{total > 0 ? Math.round(pct * 100) : 0}%</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Resuelto</p>
            </div>
        </div>
    );
};

// Sparkline (mini línea de tendencia) usando SVG
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const w = 120, h = 40;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4)}`).join(' ');

    return (
        <svg width={w} height={h} className="overflow-visible">
            <defs>
                <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ audits, onClose }) => {
    const stats = useMemo(() => {
        const totalAudits = audits.length;
        const ownAudits = audits.filter(a => a.isOwner).length;
        const sharedAudits = totalAudits - ownAudits;

        const allIssues = audits.flatMap(a => a.issues || []);
        const totalIssues = allIssues.length;
        const resolvedIssues = allIssues.filter((i: any) => i.is_done || i.isDone).length;

        // Conteo por severidad
        const severityCounts = { Alta: 0, Media: 0, Baja: 0 };
        allIssues.forEach((i: any) => {
            const s = (i.severity || i.gravedad || '').toLowerCase();
            if (s.includes('alt') || s.includes('high')) severityCounts.Alta++;
            else if (s.includes('med')) severityCounts.Media++;
            else severityCounts.Baja++;
        });

        // Conteo por categoría
        const categoryCounts: Record<string, number> = {};
        allIssues.forEach((i: any) => {
            const cat = i.category || i.categoria || 'Sin categoría';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Tasa de resolución por auditoría (últimas 7)
        const recentResolution = audits
            .slice(0, 7)
            .reverse()
            .map(a => a.totalIssues > 0 ? Math.round((a.completedIssues / a.totalIssues) * 100) : 0);

        // Auditorías completadas
        const completedAudits = audits.filter(a => a.isCompleted).length;

        // Auditoría más reciente
        const latestAudit = audits[0];

        // Promedio de issues por auditoría
        const avgIssuesPerAudit = totalAudits > 0 ? (totalIssues / totalAudits).toFixed(1) : '0';

        return {
            totalAudits, ownAudits, sharedAudits,
            totalIssues, resolvedIssues,
            severityCounts, categoryCounts,
            recentResolution, completedAudits,
            latestAudit, avgIssuesPerAudit
        };
    }, [audits]);

    const maxCatValue = Math.max(...Object.values(stats.categoryCounts), 1);
    const categoryColors: Record<string, string> = {
        'UI/UX': '#38bdf8',
        'Backend': '#a78bfa',
        'Datos': '#34d399',
        'Seguridad': '#f87171',
        'Rendimiento': '#fbbf24',
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/95 backdrop-blur-xl overflow-y-auto py-10 px-4">
            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-5 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                            Synapse <span className="text-sky-400">Metrics</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
                            Dashboard de inteligencia de auditorías
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {audits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Sin datos todavía</p>
                        <p className="text-slate-700 text-xs mt-2">Crea tu primera auditoría para ver estadísticas</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Auditorías', value: stats.totalAudits, sub: `${stats.ownAudits} propias · ${stats.sharedAudits} compartidas`, color: 'sky' },
                                { label: 'Hallazgos', value: stats.totalIssues, sub: `~${stats.avgIssuesPerAudit} por auditoría`, color: 'indigo' },
                                { label: 'Completadas', value: stats.completedAudits, sub: `de ${stats.totalAudits} auditorías`, color: 'emerald' },
                                { label: 'Críticos', value: stats.severityCounts.Alta, sub: 'issues de alta severidad', color: 'red' },
                            ].map(({ label, value, sub, color }) => (
                                <div key={label} className={`bg-slate-900/60 border border-${color}-500/20 p-5 rounded-2xl`}>
                                    <p className={`text-3xl font-black text-${color}-400`}>{value}</p>
                                    <p className="text-[11px] font-black text-white uppercase tracking-widest mt-1">{label}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            {/* Tasa de resolución global */}
                            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tasa de Resolución Global</p>
                                <DonutChart resolved={stats.resolvedIssues} total={stats.totalIssues} />
                                <p className="text-[10px] text-slate-500 text-center">
                                    {stats.resolvedIssues} de {stats.totalIssues} hallazgos resueltos
                                </p>
                            </div>

                            {/* Distribución por severidad */}
                            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Distribución por Severidad</p>
                                <BarChart
                                    max={Math.max(...Object.values(stats.severityCounts), 1)}
                                    data={[
                                        { label: 'Crítica', value: stats.severityCounts.Alta, color: '#ef4444' },
                                        { label: 'Media', value: stats.severityCounts.Media, color: '#f59e0b' },
                                        { label: 'Baja', value: stats.severityCounts.Baja, color: '#10b981' },
                                    ]}
                                />
                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Alta', v: stats.severityCounts.Alta, c: 'red' },
                                        { label: 'Media', v: stats.severityCounts.Media, c: 'amber' },
                                        { label: 'Baja', v: stats.severityCounts.Baja, c: 'emerald' },
                                    ].map(({ label, v, c }) => (
                                        <div key={label} className={`bg-${c}-500/10 border border-${c}-500/20 rounded-xl p-2 text-center`}>
                                            <p className={`text-lg font-black text-${c}-400`}>{v}</p>
                                            <p className={`text-[9px] text-${c}-300 font-bold uppercase`}>{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tendencia de resolución */}
                            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tendencia de Resolución</p>
                                <p className="text-[10px] text-slate-600 mb-5">Últimas {stats.recentResolution.length} auditorías</p>
                                {stats.recentResolution.length >= 2 ? (
                                    <div className="flex flex-col gap-3">
                                        <Sparkline values={stats.recentResolution} />
                                        <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                                            <span>Más antigua</span><span>Más reciente</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {(() => {
                                                const first = stats.recentResolution[0];
                                                const last = stats.recentResolution[stats.recentResolution.length - 1];
                                                const diff = last - first;
                                                const arrow = diff >= 0 ? '↑' : '↓';
                                                const col = diff >= 0 ? 'text-emerald-400' : 'text-red-400';
                                                return (
                                                    <>
                                                        <span className={`text-lg font-black ${col}`}>{arrow} {Math.abs(diff)}%</span>
                                                        <span className="text-[10px] text-slate-500">vs auditoría más antigua</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-600">Se necesitan al menos 2 auditorías para mostrar tendencia</p>
                                )}
                            </div>
                        </div>

                        {/* Categorías */}
                        {Object.keys(stats.categoryCounts).length > 0 && (
                            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl mb-6">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Hallazgos por Categoría</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                                    {Object.entries(stats.categoryCounts)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([cat, count]) => (
                                            <div key={cat} className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">{cat}</span>
                                                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${(count / maxCatValue) * 100}%`,
                                                            backgroundColor: categoryColors[cat] || '#94a3b8'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-300 w-6 text-right shrink-0">{count}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Auditoría más reciente */}
                        {stats.latestAudit && (
                            <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 p-6 rounded-2xl">
                                <p className="text-[11px] font-black text-sky-400 uppercase tracking-widest mb-3">Última Auditoría</p>
                                <p className="text-slate-200 text-sm font-semibold leading-relaxed line-clamp-2">
                                    {stats.latestAudit.summary}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="text-[10px] text-slate-500 font-bold mono">
                                        {new Date(stats.latestAudit.created_at).toLocaleString()}
                                    </span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                        stats.latestAudit.isCompleted
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {stats.latestAudit.isCompleted ? 'Completada' : `${stats.latestAudit.completedIssues}/${stats.latestAudit.totalIssues} resueltos`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
