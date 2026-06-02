import * as React from 'react';
import { useState, useMemo } from 'react';
import { Issue, Severity, Category } from '../types';

// ─── tipos internos ──────────────────────────────────────────────────────────
type PlanningTab = 'kanban' | 'sprint' | 'risk' | 'fivewhys';
type KanbanCol  = 'backlog' | 'inprogress' | 'done';
type StorySize  = 'XS' | 'S' | 'M' | 'L' | 'XL';

interface SprintIssue extends Issue { storySize: StorySize; inSprint: boolean; }
interface WhyChain   { issueId: number; whys: string[] }

interface PlanningModeProps {
    issues: Issue[];
    onToggleDone: (id: number) => void;
    currentAuditSummary: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const STORY_POINTS: Record<StorySize, number> = { XS: 1, S: 2, M: 3, L: 5, XL: 8 };

const SEV_COLOR: Record<Severity, string> = {
    [Severity.HIGH]:   'bg-red-500/15 text-red-400 border-red-500/30',
    [Severity.MEDIUM]: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    [Severity.LOW]:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};
const SEV_DOT: Record<Severity, string> = {
    [Severity.HIGH]: 'bg-red-500', [Severity.MEDIUM]: 'bg-amber-500', [Severity.LOW]: 'bg-emerald-500'
};
const CAT_COLOR: Record<string, string> = {
    'UI/UX': '#38bdf8', 'Backend': '#a78bfa', 'Datos': '#34d399',
    'Seguridad': '#f87171', 'Rendimiento': '#fbbf24',
};

// Riesgo = Impacto × Probabilidad (ambos 1-3)
const RISK_IMPACT: Record<Severity, number> = {
    [Severity.HIGH]: 3, [Severity.MEDIUM]: 2, [Severity.LOW]: 1
};

// ─── subcomponentes ──────────────────────────────────────────────────────────

/** Tarjeta reutilizable de issue */
const IssueCard: React.FC<{
    issue: Issue;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
}> = ({ issue, badge, actions }) => (
    <div className={`bg-slate-900 border rounded-xl p-4 space-y-2 transition-all hover:border-sky-500/40 ${issue.isDone ? 'opacity-60 border-slate-700/50' : 'border-slate-700'}`}>
        <div className="flex items-start justify-between gap-2">
            <p className={`text-[11px] font-bold text-slate-200 leading-snug flex-1 ${issue.isDone ? 'line-through text-slate-500' : ''}`}>
                {issue.title}
            </p>
            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase shrink-0 ${SEV_COLOR[issue.severity]}`}>
                {issue.severity}
            </span>
        </div>
        {issue.category && (
            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${CAT_COLOR[issue.category] || '#94a3b8'}22`, color: CAT_COLOR[issue.category] || '#94a3b8' }}>
                {issue.category}
            </span>
        )}
        {badge}
        {actions && <div className="pt-1 border-t border-slate-800">{actions}</div>}
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// 1. KANBAN
// ══════════════════════════════════════════════════════════════════════════════
const KanbanBoard: React.FC<{ issues: Issue[]; onToggleDone: (id: number) => void }> = ({ issues, onToggleDone }) => {
    const [inProgress, setInProgress] = useState<Set<number>>(new Set());

    const columns: { id: KanbanCol; label: string; color: string; items: Issue[] }[] = [
        {
            id: 'backlog', label: 'Backlog', color: '#94a3b8',
            items: issues.filter(i => !i.isDone && !inProgress.has(i.id))
        },
        {
            id: 'inprogress', label: 'En Progreso', color: '#38bdf8',
            items: issues.filter(i => !i.isDone && inProgress.has(i.id))
        },
        {
            id: 'done', label: 'Resuelto', color: '#10b981',
            items: issues.filter(i => i.isDone)
        },
    ];

    const toggleProgress = (id: number) => {
        setInProgress(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full">
            {columns.map(col => (
                <div key={col.id} className="flex flex-col gap-3">
                    {/* Columna header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{col.label}</span>
                        <span className="ml-auto text-[10px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {col.items.length}
                        </span>
                    </div>
                    {/* Cards */}
                    <div className="space-y-3 flex-1 min-h-[120px]">
                        {col.items.length === 0 ? (
                            <div className="border border-dashed border-slate-800 rounded-xl h-20 flex items-center justify-center">
                                <p className="text-[10px] text-slate-700 font-bold uppercase">Vacío</p>
                            </div>
                        ) : col.items.map(issue => (
                            <IssueCard key={issue.id} issue={issue}
                                actions={
                                    <div className="flex gap-2 pt-1">
                                        {col.id === 'backlog' && (
                                            <button onClick={() => toggleProgress(issue.id)}
                                                className="flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all">
                                                → En Progreso
                                            </button>
                                        )}
                                        {col.id === 'inprogress' && (
                                            <>
                                                <button onClick={() => toggleProgress(issue.id)}
                                                    className="flex-1 text-[9px] font-black uppercase py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all">
                                                    ← Backlog
                                                </button>
                                                <button onClick={() => { toggleProgress(issue.id); onToggleDone(issue.id); }}
                                                    className="flex-1 text-[9px] font-black uppercase py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                                    ✓ Listo
                                                </button>
                                            </>
                                        )}
                                        {col.id === 'done' && (
                                            <button onClick={() => onToggleDone(issue.id)}
                                                className="flex-1 text-[9px] font-black uppercase py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all">
                                                ↩ Reabrir
                                            </button>
                                        )}
                                    </div>
                                }
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. SPRINT PLANNING
// ══════════════════════════════════════════════════════════════════════════════
const SprintPlanning: React.FC<{ issues: Issue[] }> = ({ issues }) => {
    const [sprintItems, setSprintItems] = useState<SprintIssue[]>(() =>
        issues.map(i => ({ ...i, storySize: 'M', inSprint: false }))
    );
    const [sprintGoal, setSprintGoal] = useState('');
    const [sprintName, setSprintName] = useState('Sprint 1');

    const backlog = sprintItems.filter(i => !i.inSprint);
    const sprint  = sprintItems.filter(i => i.inSprint);
    const totalPoints = sprint.reduce((sum, i) => sum + STORY_POINTS[i.storySize], 0);

    const toggle = (id: number) => setSprintItems(prev =>
        prev.map(i => i.id === id ? { ...i, inSprint: !i.inSprint } : i)
    );
    const setSize = (id: number, size: StorySize) => setSprintItems(prev =>
        prev.map(i => i.id === id ? { ...i, storySize: size } : i)
    );

    const SizeSelector: React.FC<{ item: SprintIssue }> = ({ item }) => (
        <div className="flex gap-1 mt-2">
            {(['XS','S','M','L','XL'] as StorySize[]).map(s => (
                <button key={s} onClick={() => setSize(item.id, s)}
                    className={`w-7 h-7 text-[9px] font-black rounded transition-all ${item.storySize === s
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                    {s}
                </button>
            ))}
            <span className="ml-1 text-[9px] text-indigo-400 font-black self-center">{STORY_POINTS[item.storySize]}pt</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Sprint config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Nombre del Sprint</label>
                    <input value={sprintName} onChange={e => setSprintName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Objetivo del Sprint</label>
                    <input value={sprintGoal} onChange={e => setSprintGoal(e.target.value)}
                        placeholder="¿Qué se va a lograr en este sprint?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Backlog */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Product Backlog</span>
                        <span className="bg-slate-800 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">{backlog.length}</span>
                    </div>
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {backlog.length === 0
                            ? <div className="border border-dashed border-slate-800 rounded-xl h-20 flex items-center justify-center"><p className="text-[10px] text-slate-700 font-bold uppercase">Todo en el sprint</p></div>
                            : backlog.map(item => (
                                <IssueCard key={item.id} issue={item}
                                    badge={<SizeSelector item={item} />}
                                    actions={
                                        <button onClick={() => toggle(item.id)}
                                            className="w-full text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                                            + Agregar al Sprint
                                        </button>
                                    }
                                />
                            ))}
                    </div>
                </div>

                {/* Sprint actual */}
                <div>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">{sprintName}</span>
                        <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-500/30">
                            {sprint.length} issues · {totalPoints} pts
                        </span>
                        {sprintGoal && (
                            <span className="text-[10px] text-slate-500 italic truncate max-w-xs">"{sprintGoal}"</span>
                        )}
                    </div>
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {sprint.length === 0
                            ? <div className="border border-dashed border-indigo-500/20 rounded-xl h-24 flex items-center justify-center"><p className="text-[10px] text-indigo-900 font-bold uppercase">Arrastra issues aquí</p></div>
                            : sprint.map(item => (
                                <IssueCard key={item.id} issue={item}
                                    badge={<SizeSelector item={item} />}
                                    actions={
                                        <button onClick={() => toggle(item.id)}
                                            className="w-full text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                            ← Quitar del Sprint
                                        </button>
                                    }
                                />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. MATRIZ DE RIESGOS
// ══════════════════════════════════════════════════════════════════════════════
const RiskMatrix: React.FC<{ issues: Issue[] }> = ({ issues }) => {
    const [probs, setProbs] = useState<Record<number, number>>(() =>
        Object.fromEntries(issues.map(i => [i.id, 2]))
    );

    const riskScore = (issue: Issue) => RISK_IMPACT[issue.severity] * (probs[issue.id] || 2);

    const matrix: { label: string; range: [number, number]; color: string; bg: string }[] = [
        { label: 'Crítico',  range: [7, 9],  color: '#ef4444', bg: 'bg-red-500/20 border-red-500/40' },
        { label: 'Alto',     range: [5, 6],  color: '#f59e0b', bg: 'bg-amber-500/20 border-amber-500/40' },
        { label: 'Moderado', range: [3, 4],  color: '#38bdf8', bg: 'bg-sky-500/20 border-sky-500/40' },
        { label: 'Bajo',     range: [1, 2],  color: '#10b981', bg: 'bg-emerald-500/20 border-emerald-500/40' },
    ];

    const inRange = (score: number, range: [number, number]) => score >= range[0] && score <= range[1];

    return (
        <div className="space-y-6">
            <p className="text-[11px] text-slate-500">Ajusta la probabilidad de cada issue para calcular su nivel de riesgo real (<strong>Riesgo = Impacto × Probabilidad</strong>).</p>

            {/* Asignación de probabilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map(issue => (
                    <div key={issue.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEV_DOT[issue.severity]}`} />
                            <p className="text-[11px] font-bold text-slate-200 leading-snug">{issue.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 w-24 shrink-0">Probabilidad</span>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(p => (
                                    <button key={p} onClick={() => setProbs(prev => ({ ...prev, [issue.id]: p }))}
                                        className={`w-8 h-8 text-xs font-black rounded-lg transition-all ${probs[issue.id] === p
                                            ? 'bg-sky-500 text-white shadow-lg'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-500">[{['Baja', 'Media', 'Alta'][probs[issue.id] - 1]}]</span>
                            <span className="ml-auto text-[11px] font-black"
                                style={{ color: matrix.find(m => inRange(riskScore(issue), m.range))?.color || '#94a3b8' }}>
                                Riesgo: {riskScore(issue)}/9
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cuadrantes de riesgo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {matrix.map(({ label, range, bg, color }) => {
                    const items = issues.filter(i => inRange(riskScore(i), range));
                    return (
                        <div key={label} className={`border rounded-2xl p-4 ${bg}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
                                <span className="ml-auto text-[9px] font-black" style={{ color }}>{items.length}</span>
                            </div>
                            <div className="space-y-2">
                                {items.length === 0
                                    ? <p className="text-[10px] text-slate-700 font-bold">Sin issues</p>
                                    : items.map(i => (
                                        <p key={i.id} className="text-[10px] text-slate-300 font-semibold leading-snug border-l-2 pl-2" style={{ borderColor: color }}>
                                            {i.title}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. 5 PORQUÉS
// ══════════════════════════════════════════════════════════════════════════════
const FiveWhys: React.FC<{ issues: Issue[] }> = ({ issues }) => {
    const [selected, setSelected] = useState<number | null>(issues[0]?.id ?? null);
    const [chains, setChains] = useState<Record<number, string[]>>(() =>
        Object.fromEntries(issues.map(i => [i.id, ['', '', '', '', '']]))
    );

    const setWhy = (issueId: number, idx: number, value: string) => {
        setChains(prev => {
            const copy = [...(prev[issueId] || ['', '', '', '', ''])];
            copy[idx] = value;
            return { ...prev, [issueId]: copy };
        });
    };

    const selectedIssue = issues.find(i => i.id === selected);
    const whys = selected !== null ? (chains[selected] || ['', '', '', '', '']) : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de issues */}
            <div className="lg:col-span-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Selecciona un hallazgo</p>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {issues.map(issue => (
                        <button key={issue.id} onClick={() => setSelected(issue.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${selected === issue.id
                                ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEV_DOT[issue.severity]}`} />
                                <p className="text-[11px] font-bold leading-snug">{issue.title}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cadena de 5 porqués */}
            <div className="lg:col-span-2">
                {selectedIssue ? (
                    <div className="space-y-4">
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Problema raíz a analizar</p>
                            <p className="text-sm font-bold text-white">{selectedIssue.title}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{selectedIssue.desc}</p>
                        </div>

                        {whys.map((why, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-8 h-8 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center text-[11px] font-black text-violet-300">
                                        {idx + 1}
                                    </div>
                                    {idx < 4 && <div className="w-px flex-1 bg-violet-500/20 mt-1 min-h-[20px]" />}
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-1">
                                        ¿Por qué? {idx === 0 ? '(del problema)' : idx === 4 ? '(causa raíz)' : ''}
                                    </label>
                                    <textarea
                                        value={why}
                                        onChange={e => setWhy(selectedIssue.id, idx, e.target.value)}
                                        placeholder={idx === 0
                                            ? `¿Por qué ocurre: "${selectedIssue.title.substring(0, 40)}..."?`
                                            : idx === 4 ? 'Causa raíz identificada...'
                                            : `¿Por qué ${whys[idx - 1]?.substring(0, 40) || '...'}?`}
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none resize-none transition-all"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Causa raíz final */}
                        {whys[4] && (
                            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">✓ Causa Raíz Identificada</p>
                                <p className="text-sm text-emerald-200 font-semibold">{whys[4]}</p>
                                <p className="text-[10px] text-slate-500 mt-2">Acción sugerida: {selectedIssue.fix || 'No definida'}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-600 font-bold text-sm">← Selecciona un hallazgo</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export const PlanningMode: React.FC<PlanningModeProps> = ({ issues, onToggleDone, currentAuditSummary }) => {
    const [activeTab, setActiveTab] = useState<PlanningTab>('kanban');

    const tabs: { id: PlanningTab; label: string; icon: string; desc: string; color: string }[] = [
        { id: 'kanban',    label: 'Kanban',          icon: '⬛', desc: 'Flujo visual por estado',           color: 'sky' },
        { id: 'sprint',    label: 'Sprint Planning',  icon: '🏃', desc: 'Estimación y organización ágil',    color: 'indigo' },
        { id: 'risk',      label: 'Matriz de Riesgos', icon: '⚠️', desc: 'Impacto × Probabilidad',          color: 'amber' },
        { id: 'fivewhys',  label: '5 Porqués',        icon: '🔍', desc: 'Análisis de causa raíz',           color: 'violet' },
    ];

    if (issues.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-slate-800 rounded-2xl gap-4">
                <span className="text-4xl">📋</span>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Sin hallazgos para planificar</p>
                <p className="text-slate-600 text-xs">Analiza un texto primero para generar issues</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header + resumen */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        Modo <span className="text-violet-400">Planificación</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
                        {issues.length} hallazgos · {issues.filter(i => i.isDone).length} resueltos
                    </p>
                </div>
                {currentAuditSummary && (
                    <div className="max-w-sm bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Auditoría activa</p>
                        <p className="text-[11px] text-slate-300 line-clamp-2">{currentAuditSummary}</p>
                    </div>
                )}
            </div>

            {/* Tab selector */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col gap-1 p-4 rounded-2xl border text-left transition-all ${activeTab === tab.id
                            ? `bg-${tab.color}-500/10 border-${tab.color}-500/40 shadow-lg`
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{tab.icon}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id ? `text-${tab.color}-300` : 'text-slate-400'}`}>
                                {tab.label}
                            </span>
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold">{tab.desc}</p>
                    </button>
                ))}
            </div>

            {/* Contenido del tab activo */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 min-h-[400px] animate-in fade-in duration-200">
                {activeTab === 'kanban'   && <KanbanBoard issues={issues} onToggleDone={onToggleDone} />}
                {activeTab === 'sprint'   && <SprintPlanning issues={issues} />}
                {activeTab === 'risk'     && <RiskMatrix issues={issues} />}
                {activeTab === 'fivewhys' && <FiveWhys issues={issues} />}
            </div>
        </div>
    );
};
