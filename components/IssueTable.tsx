import React, { useState } from 'react';
import { Check, Copy, LayoutGrid, List, AlertCircle, Square, CheckSquare } from 'lucide-react';
import { Issue, Severity } from '../types';

interface IssueTableProps {
  issues: Issue[];
  onToggleDone: (id: number) => void;
  onUpdateFix: (id: number, text: string) => void;
  onUpdateTitle?: (id: number, text: string) => void;
  onUpdateDesc?: (id: number, text: string) => void;
  onExportGitHub?: (issue: Issue) => void;
  onExportTrello?: (issue: Issue) => void;
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

export const IssueTable: React.FC<IssueTableProps> = ({
  issues,
  onToggleDone,
  onUpdateFix,
  onUpdateTitle,
  onUpdateDesc,
  onExportGitHub,
  onExportTrello,
  onCopyIssue
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Efecto para establecer la vista inicial recomendada según el dispositivo
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode('cards');
    }
  }, []); // Solo al montar

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
            <List className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Tabla</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'cards' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Tarjetas</span>
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
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(issue)} className="p-1.5 text-slate-500 hover:text-sky-400 bg-slate-950 rounded-lg border border-slate-800 transition-colors" title="Copiar">
                    {copiedId === issue.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => onExportGitHub?.(issue)} className="p-1.5 text-slate-500 hover:text-emerald-400 bg-slate-950 rounded-lg border border-slate-800 transition-colors" title="Exportar a GitHub">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  </button>
                  <button onClick={() => onExportTrello?.(issue)} className="p-1.5 text-slate-500 hover:text-sky-400 bg-slate-950 rounded-lg border border-slate-800 transition-colors" title="Exportar a Trello">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.389 0H4.611C2.069 0 0 2.069 0 4.611V19.39C0 21.931 2.069 24 4.611 24h14.778C21.931 24 24 21.931 24 19.389V4.611C24 2.069 21.931 0 19.389 0zM10.8 17.4c0 .994-.806 1.8-1.8 1.8H5.4c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8H9c.994 0 1.8.806 1.8 1.8v12zm9.6-4.8c0 .994-.806 1.8-1.8 1.8h-3.6c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8h3.6c.994 0 1.8.806 1.8 1.8v7.2z" /></svg>
                  </button>
                  <CustomCheckbox isDone={issue.isDone} onClick={() => onToggleDone(issue.id)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-sky-500 uppercase">{issue.category}</span>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <input
                  value={issue.title}
                  onChange={(e) => onUpdateTitle?.(issue.id, e.target.value)}
                  className={`w-full bg-transparent text-sm font-bold border-none focus:outline-none focus:ring-0 p-0 ${issue.isDone ? 'text-slate-500 line-through' : 'text-sky-300'}`}
                />
                <textarea
                  value={issue.desc}
                  onChange={(e) => onUpdateDesc?.(issue.id, e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-400 border-none focus:outline-none focus:ring-0 p-0 leading-relaxed resize-none h-auto min-h-[40px]"
                />
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
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[100px]">Referencia</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[300px]">Hallazgo</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[120px]">Prioridad</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[300px]">Plan Técnico</th>
                  <th className="pr-6 py-4 w-32 text-center no-print">Acciones</th>
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
                      <input
                        value={issue.title}
                        onChange={(e) => onUpdateTitle?.(issue.id, e.target.value)}
                        className={`w-full bg-transparent text-sm font-bold border-none focus:outline-none focus:ring-0 p-0 mb-1 ${issue.isDone ? 'text-slate-500 line-through' : 'text-sky-300'}`}
                      />
                      <textarea
                        value={issue.desc}
                        onChange={(e) => onUpdateDesc?.(issue.id, e.target.value)}
                        className="w-full bg-transparent text-[12px] text-slate-400 border-none focus:outline-none focus:ring-0 p-0 leading-relaxed resize-none h-auto min-h-[40px]"
                      />
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
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleCopy(issue)} className="p-2 text-slate-600 hover:text-sky-400 transition-colors" title="Copiar">
                          {copiedId === issue.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => onExportGitHub?.(issue)} className="p-2 text-slate-600 hover:text-emerald-400 transition-colors" title="GitHub">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        </button>
                        <button onClick={() => onExportTrello?.(issue)} className="p-2 text-slate-600 hover:text-sky-400 transition-colors" title="Trello">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.389 0H4.611C2.069 0 0 2.069 0 4.611V19.39C0 21.931 2.069 24 4.611 24h14.778C21.931 24 24 21.931 24 19.389V4.611C24 2.069 21.931 0 19.389 0zM10.8 17.4c0 .994-.806 1.8-1.8 1.8H5.4c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8H9c.994 0 1.8.806 1.8 1.8v12zm9.6-4.8c0 .994-.806 1.8-1.8 1.8h-3.6c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8h3.6c.994 0 1.8.806 1.8 1.8v7.2z" /></svg>
                        </button>
                      </div>
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