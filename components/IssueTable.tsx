import React, { useState } from 'react';
import { Check, Copy, LayoutGrid, List, AlertCircle, Square, CheckSquare } from 'lucide-react';
import { Issue, Severity } from '../types';

interface IssueTableProps {
  issues: Issue[];
  onToggleDone: (id: number) => void;
  onUpdateFix: (id: number, text: string) => void;
  onCopyIssue?: (issue: Issue) => void;
}

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const configs = {
    [Severity.HIGH]: "bg-red-500/10 text-red-400 border-red-500/20",
    [Severity.MEDIUM]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    [Severity.LOW]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const labels = {
    [Severity.HIGH]: "Alta",
    [Severity.MEDIUM]: "Media",
    [Severity.LOW]: "Baja",
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${configs[severity]}`}>
      {labels[severity]}
    </span>
  );
};

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onToggleDone, onUpdateFix, onCopyIssue }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const handleCopy = (issue: Issue) => {
    if (onCopyIssue) {
      onCopyIssue(issue);
      setCopiedId(issue.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Componente interno para el Checkbox Cuadrado
  const CustomCheckbox = ({ isDone, onClick }: { isDone: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`transition-all duration-200 transform active:scale-90 ${isDone ? 'text-sky-500' : 'text-slate-600 hover:text-slate-400'
        }`}
    >
      {isDone ? (
        <CheckSquare className="w-6 h-6 fill-sky-500/10" strokeWidth={2.5} />
      ) : (
        <Square className="w-6 h-6" strokeWidth={2} />
      )}
    </button>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-sky-400" />
            {issues.length > 0 && issues.every(i => i.isDone) ? (
              <span className="text-emerald-400 animate-pulse flex items-center gap-2">
                <Check className="w-5 h-5" /> LISTA REALIZADA
              </span>
            ) : (
              "Hallazgos Identificados"
            )}
          </h2>
          <p className="text-sm text-slate-500">
            {issues.length > 0 && issues.every(i => i.isDone)
              ? "Todos los requerimientos han sido validados"
              : "Estado de revisión de requerimientos"}
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-3.5 h-3.5" /> Tabla
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'cards' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        /* --- VISTA DE TARJETAS --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <div key={issue.id} className={`bg-slate-900/40 border rounded-2xl p-5 transition-all ${issue.isDone ? 'border-slate-800/60 opacity-60 grayscale-[0.3]' : 'border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/50'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  REQ-{issue.id.toString().padStart(3, '0')}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleCopy(issue)} className="p-1 text-slate-500 hover:text-sky-400">
                    {copiedId === issue.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <CustomCheckbox isDone={issue.isDone} onClick={() => onToggleDone(issue.id)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-sky-500 uppercase">{issue.category}</span>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <h3 className={`text-sm font-bold ${issue.isDone ? 'text-slate-500 line-through' : 'text-sky-300'}`}>{issue.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{issue.desc}</p>
                <textarea
                  value={issue.fix}
                  onChange={(e) => onUpdateFix(issue.id, e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-sky-500/50 outline-none h-24 mt-2"
                  placeholder="Definir resolución..."
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* --- VISTA DE TABLA --- */
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800/80">
                  <th className="pl-6 py-4 w-12 no-print"></th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Referencia</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/3">Hallazgo</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Prioridad</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/3">Plan Técnico</th>
                  <th className="pr-6 py-4 w-12 text-center no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {issues.map((issue) => (
                  <tr key={issue.id} className={`group transition-colors ${issue.isDone ? 'bg-slate-950/20 opacity-60' : 'bg-indigo-500/5 hover:bg-indigo-500/10'}`}>
                    <td className="pl-6 py-6 align-top no-print">
                      <CustomCheckbox isDone={issue.isDone} onClick={() => onToggleDone(issue.id)} />
                    </td>
                    <td className="px-4 py-6 align-top">
                      <span className="font-mono text-[11px] text-slate-500">REQ-{issue.id.toString().padStart(3, '0')}</span>
                    </td>
                    <td className="px-4 py-6 align-top">
                      <div className={`text-sm font-bold mb-1 ${issue.isDone ? 'text-slate-500 line-through' : 'text-sky-300'}`}>{issue.title}</div>
                      <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-2">{issue.desc}</p>
                    </td>
                    <td className="px-4 py-6 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black text-sky-500/80 uppercase">{issue.category}</span>
                        <SeverityBadge severity={issue.severity} />
                      </div>
                    </td>
                    <td className="px-4 py-6 align-top">
                      <textarea
                        value={issue.fix}
                        onChange={(e) => onUpdateFix(issue.id, e.target.value)}
                        className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-[12px] font-mono text-slate-300 focus:border-sky-500/50 outline-none h-24 no-print"
                        placeholder="Resolución de ingeniería..."
                      />
                    </td>
                    <td className="pr-6 py-6 align-top text-center no-print">
                      <button onClick={() => handleCopy(issue)} className="p-2 text-slate-600 hover:text-sky-400 transition-colors">
                        {copiedId === issue.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};