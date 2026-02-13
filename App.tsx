import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { analyzeIssues, generateTasks } from './services/geminiService';
import { analyzeIssuesWithGroq, generateTasksWithGroq } from './services/groqService';
import { Issue, Provider, Severity } from './types';
import { MicrophoneButton } from './components/MicrophoneButton';
import { IssueTable } from './components/IssueTable';
import { Auth } from './components/Auth';
import { ToastProvider, useToast } from './components/Toast';
import { Session } from '@supabase/supabase-js';

// Componente Wrapper para proporcionar el contexto
const AppWrapper = () => (
  <ToastProvider>
    <App />
  </ToastProvider>
);

const App: React.FC = () => {
  const [provider, setProvider] = useState<Provider>(() => {
    return (localStorage.getItem('selected_provider') as Provider) || 'gemini';
  });

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    localStorage.setItem('selected_provider', newProvider);
  };
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customGeminiKey, setCustomGeminiKey] = useState(localStorage.getItem('custom_gemini_key') || '');
  const [customGroqKey, setCustomGroqKey] = useState(localStorage.getItem('custom_groq_key') || '');
  const [useSystemKey, setUseSystemKey] = useState(true);
  const [systemCredits, setSystemCredits] = useState(() => {
    const savedCount = localStorage.getItem('synapse_credits');
    return savedCount !== null ? parseInt(savedCount) : 10; // 10 créditos por defecto
  });
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [groqKeyError, setGroqKeyError] = useState<string | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<number | null>(null);


  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const { addToast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null); // Ref para el textarea

  const isDbConnected = !!supabase;

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsSessionLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const [loadingMessage, setLoadingMessage] = useState('Analizando trazas...');
  const messages = [
    "Iniciando escaneo neural...",
    "Procesando entrada de datos...",
    "Analizando trazas de error...",
    "Extrayendo lo más importante...",
    "Sincronizando con el núcleo Synapse...",
    isDbConnected ? "Almacenando en base de datos central..." : "Preparando respuesta local..."
  ];

  useEffect(() => {
    if (isDbConnected && session) fetchRecentAudits();
  }, [isDbConnected, session]);

  useEffect(() => {
    let interval: number;
    if (isAnalyzing) {
      let idx = 0;
      interval = window.setInterval(() => {
        idx = (idx + 1) % messages.length;
        setLoadingMessage(messages[idx]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const fetchRecentAudits = async () => {
    if (!supabase || !session) return;
    try {
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          issues (
            is_done
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error("Error al cargar historial:", error);
        addToast(`Error al cargar historial: ${error.message}`, "error");
      } else {
        // Calcular el estado de completado para cada auditoría
        const auditsWithStatus = (data || []).map(audit => {
          const totalIssues = audit.issues?.length || 0;
          const completedIssues = audit.issues?.filter((i: any) => i.is_done).length || 0;
          return {
            ...audit,
            isCompleted: totalIssues > 0 && totalIssues === completedIssues,
            totalIssues,
            completedIssues
          };
        });
        setRecentAudits(auditsWithStatus);
      }
    } catch (e: any) {
      console.error("Excepción al cargar historial", e);
      addToast("Excepción al conectar con la base de datos", "error");
    }
  };

  const exportPDF = () => {
    const pdfContainer = document.createElement('div');
    pdfContainer.style.padding = '40px';
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    pdfContainer.style.color = '#1a202c';
    pdfContainer.style.backgroundColor = '#ffffff';

    const severityStyles = (s: Severity) => {
      if (s === Severity.HIGH) return 'color: #e53e3e; font-weight: bold;';
      if (s === Severity.MEDIUM) return 'color: #dd6b20; font-weight: bold;';
      return 'color: #38a169; font-weight: bold;';
    };

    let issuesHtml = issues.map(issue => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; vertical-align: top; font-family: monospace; font-size: 10px;">REQ-${issue.id.toString().padStart(3, '0')}</td>
        <td style="padding: 12px; vertical-align: top;">
          <div style="font-weight: bold; margin-bottom: 4px; ${issue.isDone ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${issue.title}</div>
          <div style="font-size: 11px; color: #4a5568;">${issue.desc}</div>
        </td>
        <td style="padding: 12px; vertical-align: top; font-size: 10px;">
          <div style="margin-bottom: 4px;">${issue.category}</div>
          <div style="${severityStyles(issue.severity)} text-transform: uppercase;">${issue.severity}</div>
        </td>
        <td style="padding: 12px; vertical-align: top; font-size: 11px; font-style: italic; background-color: #f8fafc; border-left: 2px solid #cbd5e1;">
          ${issue.fix || 'Pendiente de resolución técnica.'}
        </td>
      </tr>
    `).join('');

    pdfContainer.innerHTML = `
      <div style="border-bottom: 4px solid #0ea5e9; padding-bottom: 24px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 28px; color: #0f172a; text-transform: uppercase; letter-spacing: -1px;">Informe de Auditoría Técnica</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Synapse QA System // Neural Intelligence</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #94a3b8; font-family: monospace;">ID: ${currentAuditId || 'SESSION-TEMP'}<br>Fecha: ${new Date().toLocaleDateString()}</div>
      </div>
      <div style="background-color: #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 12px; text-transform: uppercase; color: #0ea5e9; margin-top: 0; margin-bottom: 12px; letter-spacing: 1px; font-weight: 800;">Resumen Ejecutivo</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b; margin-bottom: 0;">${summary}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase; width: 60px;">Ref</th>
            <th style="padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase;">Análisis</th>
            <th style="padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase; width: 100px;">Prioridad</th>
            <th style="padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase;">Acción Sugerida</th>
          </tr>
        </thead>
        <tbody>${issuesHtml}</tbody>
      </table>
      <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center;">
        Este documento es un reporte generado automáticamente por el núcleo Synapse. Todos los hallazgos son preliminares y deben ser validados por el equipo de ingeniería responsable.
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `Synapse_Audit_Report_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().from(pdfContainer).set(opt).save();
  };

  // Exportar reporte detallado en JSON
  const exportDetailedJSON = () => {
    const detailedReport = {
      id: currentAuditId || 'SESSION-TEMP',
      date: new Date().toLocaleDateString(),
      summary,
      issues: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.desc,
        category: issue.category,
        severity: issue.severity,
        fix: issue.fix,
        status: issue.isDone ? 'Resuelto' : 'Pendiente'
      }))
    };
    const blob = new Blob([JSON.stringify(detailedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synapse_Detailed_Report_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a Markdown
  const exportMarkdown = () => {
    let md = `# Informe de Auditoría Técnica\n\n`;
    md += `**ID:** ${currentAuditId || 'SESSION-TEMP'} | **Fecha:** ${new Date().toLocaleDateString()}\n\n`;
    md += `## Resumen Ejecutivo\n${summary}\n\n`;
    md += `## Hallazgos (${issues.length})\n\n`;
    issues.forEach(issue => {
      md += `### [${issue.severity}] ${issue.title}\n`;
      md += `**Categoría:** ${issue.category}\n\n`;
      md += `**Descripción:** ${issue.desc}\n\n`;
      md += `**Acción Sugerida:** ${issue.fix || 'Pendiente'}\n\n`;
      md += `**Estado:** ${issue.isDone ? '✅ Resuelto' : '⏳ Pendiente'}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synapse_Report_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a LaTeX
  const exportLatex = () => {
    let latex = `\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\title{Informe de Auditoría Técnica}\n\\author{Synapse QA System}\n\\begin{document}\n\\maketitle\n\n`;
    latex += `\\textbf{ID:} ${currentAuditId || 'SESSION-TEMP'} \\\\\n`;
    latex += `\\textbf{Fecha:} ${new Date().toLocaleDateString()} \\\\\n\n`;
    latex += `\\section*{Resumen Ejecutivo}\n${summary}\n\n`;
    latex += `\\section*{Hallazgos}\n`;
    issues.forEach((issue, idx) => {
      latex += `\\subsection*{${idx + 1}. [${issue.severity}] ${issue.title}}\n`;
      latex += `\\textbf{Categoría:} ${issue.category} \\\\\n`;
      latex += `\\textbf{Descripción:} ${issue.desc} \\\\\n`;
      latex += `\\textbf{Acción:} ${issue.fix || 'Pendiente'} \\\\\n`;
      latex += `\\textbf{Estado:} ${issue.isDone ? 'Resuelto' : 'Pendiente'} \\\\\n\n`;
    });
    latex += `\\end{document}`;
    const blob = new Blob([latex], { type: 'application/x-latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synapse_Report_${new Date().getTime()}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a CSV
  const exportCSV = () => {
    let csv = 'ID,Título,Descripción,Categoría,Severidad,Acción Sugerida,Estado\n';
    issues.forEach(issue => {
      const desc = issue.desc.replace(/"/g, '""');
      const fix = (issue.fix || '').replace(/"/g, '""');
      csv += `"${issue.id}","${issue.title}","${desc}","${issue.category}","${issue.severity}","${fix}","${issue.isDone ? 'Resuelto' : 'Pendiente'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synapse_Report_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const copyToClipboard = (text: string, onSuccess: () => void) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        onSuccess();
        addToast("Contenido copiado al portapapeles", "success");
      }).catch(() => fallbackCopy(text, onSuccess));
    } else {
      fallbackCopy(text, onSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess();
      addToast("Contenido copiado al portapapeles", "success");
    } catch (err) {
      console.error('No se pudo copiar el texto', err);
      addToast("Error al copiar al portapapeles", "error");
    }
    document.body.removeChild(textArea);
  };

  // Copiar Fila Individual
  const handleCopyIssue = (issue: Issue) => {
    let text = `ANÁLISIS: ${issue.title}\n`;
    text += `DESCRIPCIÓN: ${issue.desc.replace(/\t|\n/g, ' ').trim()}\n`;
    text += `ACCIÓN: ${(issue.fix || '').replace(/\t|\n/g, ' ').trim()}\n`;
    text += `ESTADO: ${issue.isDone ? 'Resuelto' : 'Pendiente'}`;

    copyToClipboard(text, () => {
      // Feedback visual opcional o notificación toast si se desea
      // Por ahora confiamos en el botón de la fila para mostrar feedback
    });
  };

  // Copiar Todo el Reporte
  const handleCopyAll = () => {
    let report = `INFORME DE AUDITORÍA TÉCNICA - SYNAPSE QA SYSTEM\n`;
    report += `================================================\n`;
    report += `ID: ${currentAuditId || 'SESSION-TEMP'}\n`;
    report += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
    report += `RESUMEN EJECUTIVO\n`;
    report += `-----------------\n`;
    report += `${summary}\n\n`;
    report += `HALLAZGOS DETALLADOS\n`;
    report += `--------------------\n`;

    issues.forEach(issue => {
      report += `\n[${issue.severity.toUpperCase()}] REQ-${issue.id.toString().padStart(3, '0')}: ${issue.title}\n`;
      report += `Categoría: ${issue.category}\n`;
      report += `Descripción: ${issue.desc}\n`;
      report += `Acción Sugerida: ${issue.fix || 'Pendiente de resolución técnica.'}\n`;
      report += `Estado: ${issue.isDone ? 'RESUELTO' : 'PENDIENTE'}\n`;
    });

    copyToClipboard(report, () => {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    });
  };

  // Calcular estadísticas
  const stats = {
    total: issues.length,
    resueltos: issues.filter(i => i.isDone).length,
    pendientes: issues.filter(i => !i.isDone).length,
    altas: issues.filter(i => i.severity === Severity.HIGH).length,
    medias: issues.filter(i => i.severity === Severity.MEDIUM).length,
    bajas: issues.filter(i => i.severity === Severity.LOW).length
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("DATOS_FALTANTES: Ingrese la descripción del problema.");
      return;
    }

    // Validar Llaves
    if (!useSystemKey) {
      if (provider === 'gemini' && !customGeminiKey.trim()) {
        setError("API_KEY_FALTANTE: Ingrese su llave de Gemini.");
        return;
      }
      if (provider === 'groq' && !customGroqKey.trim()) {
        setShowApiConfig(true);
        setGroqKeyError("Falta su Groq API Key.");
        return;
      }
    } else if (systemCredits <= 0) {
      setError("CREDITOS_AGOTADOS: No quedan créditos del sistema. Use su propia API Key.");
      setShowApiConfig(true);
      setUseSystemKey(false);
      return;
    }

    setGroqKeyError(null);
    setIsAnalyzing(true);
    setError(null);
    try {
      let response;
      const activeKey = useSystemKey ? undefined : (provider === 'gemini' ? customGeminiKey : customGroqKey);

      if (provider === 'gemini') {
        response = await analyzeIssues(inputText, activeKey);
      } else if (provider === 'groq') {
        response = await analyzeIssuesWithGroq(inputText, activeKey || '', 'llama-3.3-70b-versatile');
      } else {
        throw new Error('Proveedor no válido');
      }

      // Decrementar créditos si se usó la del sistema
      if (useSystemKey) {
        const nextCredits = Math.max(0, systemCredits - 1);
        setSystemCredits(nextCredits);
        localStorage.setItem('synapse_credits', nextCredits.toString());
      }

      let finalIssues = response.issues;

      if (supabase && session) {
        const { data: audit, error: auditError } = await supabase
          .from('audits')
          .insert([{
            summary: response.summary,
            input_text: inputText,
            user_id: session.user.id
          }])
          .select().single();

        if (auditError) {
          console.error("Error guardando auditoría:", auditError);
          addToast(`Error al guardar: ${auditError.message}`, "error");
        } else if (audit) {
          setCurrentAuditId(audit.id);
          const issuesToInsert = response.issues.map(i => ({
            audit_id: audit.id,
            external_id: i.id,
            title: i.title,
            description: i.desc,
            category: i.category,
            severity: i.severity,
            fix_plan: i.fix,
            is_done: false
          }));

          const { data: insertedIssues } = await supabase.from('issues').insert(issuesToInsert).select();

          let finalIssues = response.issues;
          if (insertedIssues) {
            finalIssues = response.issues.map(i => {
              const dbRecord = insertedIssues.find(si => si.external_id === i.id);
              return { ...i, dbId: dbRecord?.id, isDone: false };
            });
          }
          setIssues(finalIssues);
          fetchRecentAudits();
          addToast("Análisis guardado exitosamente", "success");
        }
      }

      setSummary(response.summary);
    } catch (err: any) {
      setError(err.message || "ERROR_SISTEMA: No se pudo completar el análisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!inputText.trim()) {
      setError('Por favor ingrese texto para procesar');
      return;
    }

    setIsAnalyzing(true);
    setLoadingMessage("Generando lista de tareas...");
    setError(null);
    setSummary('');
    setIssues([]);
    setGeneratedCode('');
    setSelectedIssue(null);
    setCurrentAuditId(null);

    try {
      let result;
      if (provider === 'groq') {
        const apiKey = useSystemKey ? undefined : customGroqKey;
        if (!useSystemKey && !apiKey) throw new Error("API Key de Groq requerida");
        result = await generateTasksWithGroq(inputText, apiKey || '', 'llama-3.3-70b-versatile');
      } else {
        const apiKey = useSystemKey ? undefined : customGeminiKey;
        if (!useSystemKey && !apiKey) throw new Error("API Key de Gemini requerida");

        if (useSystemKey) {
          const currentCredits = parseInt(localStorage.getItem('synapse_credits') || '10');
          if (currentCredits <= 0) throw new Error("Créditos del sistema agotados. Use su propia API Key.");
          setSystemCredits(currentCredits - 1);
          localStorage.setItem('synapse_credits', (currentCredits - 1).toString());
        }

        result = await generateTasks(inputText, apiKey);
      }

      setSummary(result.summary);
      setIssues(result.issues);

      if (supabase && session) {
        const { data: audit, error: auditError } = await supabase
          .from('audits')
          .insert([{
            summary: `[TAREAS] ${result.summary}`,
            input_text: inputText,
            user_id: session.user.id
          }])
          .select().single();

        if (auditError) {
          console.error("Error guardando tareas:", auditError);
          addToast(`Error al guardar: ${auditError.message}`, "error");
        } else if (audit) {
          setCurrentAuditId(audit.id);
          const tasksToInsert = result.issues.map(i => ({
            audit_id: audit.id,
            external_id: i.id,
            title: i.title,
            description: i.desc,
            category: i.category,
            severity: i.severity,
            fix_plan: i.fix,
            is_done: false
          }));

          const { data: insertedIssues } = await supabase.from('issues').insert(tasksToInsert).select();

          let finalIssues = result.issues;
          if (insertedIssues) {
            finalIssues = result.issues.map(i => {
              const dbRecord = insertedIssues.find(si => si.external_id === i.id);
              return { ...i, dbId: dbRecord?.id, isDone: false };
            });
          }
          setIssues(finalIssues);
          fetchRecentAudits();
          addToast("Lista de tareas guardada", "success");
        }
      }

    } catch (err: any) {
      setError(err.message || 'Error al generar tareas');
      addToast(err.message || 'Error al generar tareas', "error");
    } finally {
      setIsAnalyzing(false);
      setLoadingMessage("Analizando trazas...");
    }
  };

  const loadPreviousAudit = async (audit: any) => {
    if (!supabase) return;
    setIsAnalyzing(true);
    setCurrentAuditId(audit.id);
    try {
      let finalIssues: Issue[] = [];

      // 1. Intentar cargar de la tabla 'issues' (esquema normalizado)
      const { data: storedIssues, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .eq('audit_id', audit.id)
        .order('external_id', { ascending: true });

      if (!issuesError && storedIssues && storedIssues.length > 0) {
        finalIssues = storedIssues.map(si => ({
          dbId: si.id,
          id: si.external_id,
          title: si.title,
          desc: si.description,
          category: si.category as any,
          severity: si.severity as Severity,
          fix: si.fix_plan || '',
          isDone: si.is_done
        }));
      } else {
        // 2. Fallback al esquema plano (columna JSON 'issues')
        finalIssues = (audit.issues || []).map((i: any) => ({
          id: i.id,
          title: i.title,
          desc: i.desc || i.description,
          category: i.category,
          severity: i.severity,
          fix: i.fix || i.fix_plan || '',
          isDone: i.isDone || i.is_done || false
        }));
      }

      setSummary(audit.summary);
      setIssues(finalIssues);
      setInputText(audit.raw_input || audit.input_text || '');
    } catch (e) {
      console.error("Error al cargar auditoría:", e);
      setError("No se pudo cargar la auditoría previa.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleDone = async (id: number) => {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    const newStatus = !issue.isDone;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, isDone: newStatus } : i));
    if (supabase && issue.dbId) {
      await supabase.from('issues').update({ is_done: newStatus }).eq('id', issue.dbId);
      // Actualizar el estado local de recentAudits para reflejar el cambio en la sidebar
      setRecentAudits(prev => prev.map(audit => {
        if (String(audit.id) === String(currentAuditId)) {
          const newCompletedCount = newStatus ? audit.completedIssues + 1 : audit.completedIssues - 1;
          return {
            ...audit,
            completedIssues: newCompletedCount,
            isCompleted: audit.totalIssues > 0 && newCompletedCount === audit.totalIssues
          };
        }
        return audit;
      }));
    }
  };

  const handleUpdateFix = async (id: number, text: string) => {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, fix: text } : i));
    if (supabase && issue.dbId) {
      await supabase.from('issues').update({ fix_plan: text }).eq('id', issue.dbId);
      // No mostramos toast aquí para no saturar mientras escribe
    }
  };

  const handleTranscript = (text: string) => {
    setInputText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
    addToast("Dictado por voz reconocido", "info");
  };

  // Funciones de la Barra de Herramientas de Terminal
  const handleClearTerminal = () => {
    setInputText('');
    setIssues([]);
    setSummary('');
    setCurrentAuditId(null);
    addToast("Terminal reiniciada correctamente", "warning");
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          addToast("Texto pegado desde el portapapeles", "success");
        } else {
          addToast("El portapapeles está vacío", "info");
        }
      } else {
        throw new Error("Clipboard API no disponible");
      }
    } catch (err) {
      console.warn('Acceso al portapapeles restringido:', err);
      textareaRef.current?.focus();
      setTimeout(() => {
        addToast("Permiso restringido. Presione Ctrl+V para pegar.", "info");
      }, 100);
    }
  };

  const handleDeleteAudit = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evitar que el clic active la carga del audit
    setAuditToDelete(id);
  };

  const confirmDeleteAudit = async () => {
    if (!supabase || auditToDelete === null) return;

    const id = auditToDelete;
    const { error } = await supabase.from('audits').delete().eq('id', id);

    if (error) {
      addToast(`Error al eliminar: ${error.message}`, "error");
    } else {
      setRecentAudits(prev => prev.filter(a => a.id !== id));
      addToast("Auditoría eliminada correctamente", "success");

      // Si se eliminó la auditoría actual, limpiar la vista
      if (currentAuditId === String(id)) {
        setCurrentAuditId(null);
        setIssues([]);
        setSummary('');
        setInputText('');
      }
    }
    setAuditToDelete(null);
  };

  const handleLoadSample = () => {
    const sample = `[ERROR] 2024-03-15 14:32:01 | Critical Exception in PaymentGateway
    Status: 500 Internal Server Error
    Message: Timeout waiting for upstream response from stripe.confirmPayment()
    Stack Trace:
    at PaymentController.process (/app/src/controllers/payment.ts:45:12)
    at async mk_activity (/app/node_modules/express/lib/router/layer.js:95:5)
    
    User Context: ID=48291, Region=US-East, Tier=Premium`;
    setInputText(sample);
    addToast("Datos de ejemplo cargados", "info");
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-slate-200">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-[4px] border-sky-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-[4px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] mono text-slate-500 font-bold uppercase tracking-[0.3em] animate-pulse">Cargando Synapse...</p>
      </div>
    );
  }

  if (!session && supabase) {
    return <Auth onLoginSuccess={() => fetchRecentAudits()} />;
  }

  return (
    <div className="flex flex-col w-full min-h-[100dvh] selection:bg-sky-500/30 relative bg-[#0a0c10] text-slate-200">

      {/* Modal de Carga Neural */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full mx-4 transform animate-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-[6px] border-sky-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-sky-500/20 rounded-full animate-pulse flex items-center justify-center font-black text-2xl text-sky-400">S</div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-white font-extrabold text-xl tracking-tight uppercase">Sincronizando Synapse</h3>
              <p className="text-sky-500 mono text-[10px] font-bold uppercase tracking-[0.3em]">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {auditToDelete !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 transform animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-white font-bold text-lg">¿Eliminar Auditoría?</h3>
              <p className="text-slate-400 text-xs">Esta acción no se puede deshacer. Los datos se perderán permanentemente.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setAuditToDelete(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] uppercase tracking-widest rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAudit}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Corporativo */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 md:px-10 py-4 md:py-6 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-5 w-full md:w-auto justify-center md:justify-start">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center font-black text-white shadow-2xl shadow-sky-500/20">S</div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase leading-tight">Synapse <span className="text-sky-500 font-light">Audit</span></h1>
            <p className="text-[10px] mono text-slate-500 font-bold uppercase tracking-[0.3em]">Neural QA System // Resilient v4.5</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {isDbConnected ? 'DB Connected' : 'DB Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full p-4 md:p-10 space-y-8 md:space-y-12 max-w-[1800px] mx-auto">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">

            {/* Selector de Proveedor y Configuración */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0d1117] p-2 rounded-lg border border-slate-800 mb-4">
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto mb-2 sm:mb-0">
                <button
                  onClick={() => handleProviderChange('gemini')}
                  className={`flex-1 px-6 py-2 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${provider === 'gemini' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Gemini 1.5 Flash
                </button>
                <button
                  onClick={() => handleProviderChange('groq')}
                  className={`flex-1 px-6 py-2 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${provider === 'groq' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Groq (Llama 3)
                </button>
              </div>

              <button
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="w-full sm:w-auto px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>⚙️</span> {showApiConfig ? 'Ocultar Config' : 'Configurar APIs'}
              </button>
            </div>

            {/* Panel de Configuración de API Keys */}
            {showApiConfig && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Configuración de Llaves (API Keys)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${systemCredits > 0 ? 'bg-sky-500/10 text-sky-400' : 'bg-red-500/10 text-red-400'}`}>
                      Créditos: {systemCredits}
                    </span>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Usar Llave del Sistema (Demo)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Utiliza la API Key interna mientras tengas créditos disponibles.</p>
                    </div>
                    <button
                      onClick={() => systemCredits > 0 && setUseSystemKey(!useSystemKey)}
                      className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors ${systemCredits <= 0 ? 'bg-slate-800 cursor-not-allowed' : (useSystemKey ? 'bg-sky-500' : 'bg-slate-700')}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useSystemKey ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                </div>

                {!useSystemKey && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    {/* Gemini Config */}
                    <div>
                      <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-2">
                        Su Google Gemini API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={customGeminiKey}
                          onChange={(e) => {
                            setCustomGeminiKey(e.target.value);
                            localStorage.setItem('custom_gemini_key', e.target.value);
                          }}
                          placeholder="AIza..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all mono"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showApiKey ? "👁️" : "🔒"}
                        </button>
                      </div>
                    </div>

                    {/* Groq Config */}
                    <div>
                      <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-2">
                        Su Groq API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={customGroqKey}
                          onChange={(e) => {
                            setCustomGroqKey(e.target.value);
                            localStorage.setItem('custom_groq_key', e.target.value);
                          }}
                          placeholder="gsk_..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-300 focus:border-orange-500 outline-none transition-all mono"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showApiKey ? "👁️" : "🔒"}
                        </button>
                      </div>
                      {groqKeyError && <p className="text-red-500 text-[10px] mt-1 font-bold">{groqKeyError}</p>}
                    </div>
                  </div>
                )}

                {useSystemKey && (
                  <div className="text-center py-6 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium italic">
                      "Modo Invitado Activo: Sus llaves personales están ocultas y seguras."
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
              {/* Efecto de Escaneo Láser Restaurado */}
              {isAnalyzing && <div className="scanner-bar"></div>}

              <div className="flex justify-between items-center mb-6">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Terminal de Entrada de Datos</label>
                <div className="flex gap-2">
                  {/* Barra de Herramientas de Terminal */}
                  <button onClick={handlePasteClipboard} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider" title="Pegar del portapapeles">Pegar</button>
                  <button onClick={handleLoadSample} className="text-[10px] bg-slate-800 hover:bg-sky-900/40 text-sky-400 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider" title="Cargar ejemplo">Demo</button>
                  <button onClick={handleClearTerminal} className="text-[10px] bg-slate-800 hover:bg-red-900/40 text-red-400 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider" title="Limpiar todo">Limpiar</button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="Pegue aquí los logs de consola, reportes de Jira o descripción del fallo..."
                className="w-full bg-slate-950/80 border border-slate-800 p-6 text-base text-slate-200 focus:border-sky-500 outline-none transition-all min-h-[260px] rounded-xl resize-none shadow-inner"
              />
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 md:mt-8 gap-4 md:gap-0">
                <MicrophoneButton onTranscript={handleTranscript} isListening={isListening} setIsListening={setIsListening} />
                <button
                  onClick={handleGenerateTasks}
                  disabled={isAnalyzing}
                  className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hidden md:block" // Oculto en móvil si es muy ancho, ajustar según necesidad
                >
                  Generar Tareas
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isAnalyzing}
                  className="w-full md:w-auto px-12 py-4 bg-sky-500 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analizar Hallazgos
                </button>
              </div>
              {error && <div className="mt-6 p-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">{error}</div>}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/20 border border-slate-800/40 p-8 rounded-2xl flex flex-col h-full backdrop-blur-sm">
              <h3 className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-6">Logs Recientes (Supabase)</h3>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[440px] pr-2">
                {isDbConnected ? (
                  recentAudits.length > 0 ? recentAudits.map((audit) => (
                    <div key={audit.id} onClick={() => loadPreviousAudit(audit)} className={`cursor-pointer w-full text-left p-4 bg-slate-900/50 border rounded-xl hover:border-sky-500 transition-all group relative ${String(currentAuditId) === String(audit.id) ? (audit.isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-sky-500 bg-sky-500/5') : (audit.isCompleted ? 'border-emerald-500/10 opacity-70' : 'border-slate-800')}`}>
                      <div className="flex justify-between items-start gap-3">
                        <p className={`text-[11px] font-bold uppercase truncate group-hover:text-sky-400 pr-2 flex-1 ${audit.isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {audit.summary.substring(0, 60)}...
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {audit.isCompleted && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-tighter">DONE</span>
                          )}
                          <button
                            onClick={(e) => handleDeleteAudit(e, audit.id)}
                            className="text-slate-600 hover:text-red-500 transition-colors p-1"
                            title="Eliminar registro"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-[9px] text-slate-600 mono font-bold">{new Date(audit.created_at).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          {audit.totalIssues > 0 && (
                            <span className="text-[8px] text-slate-500 font-mono">{audit.completedIssues}/{audit.totalIssues}</span>
                          )}
                          <span className="text-[8px] text-sky-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 italic">Abrir</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-40 border border-dashed border-slate-800 rounded-xl text-center px-4">
                      <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Esperando Registros...</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-xl text-center px-6">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3">Database Offline</p>
                    <p className="text-[9px] text-slate-700 font-medium">Configure las credenciales de Supabase para activar la persistencia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {(issues.length > 0 || isAnalyzing) && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
            {isAnalyzing ? (
              <div className="space-y-8"><div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-sky-500 w-1/3 animate-[shimmer_2s_infinite]"></div></div></div>
            ) : (
              <>
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                  <div className="bg-slate-900/60 border border-slate-700 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-sky-500">{stats.total}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Total</p>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-700/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-emerald-400">{stats.resueltos}</p>
                    <p className="text-[9px] text-emerald-300 uppercase font-bold">Resueltos</p>
                  </div>
                  <div className="bg-amber-900/30 border border-amber-700/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-amber-400">{stats.pendientes}</p>
                    <p className="text-[9px] text-amber-300 uppercase font-bold">Pendientes</p>
                  </div>
                  <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-red-400">{stats.altas}</p>
                    <p className="text-[9px] text-red-300 uppercase font-bold">Críticas</p>
                  </div>
                  <div className="bg-orange-900/30 border border-orange-700/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-orange-400">{stats.medias}</p>
                    <p className="text-[9px] text-orange-300 uppercase font-bold">Medias</p>
                  </div>
                  <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-green-400">{stats.bajas}</p>
                    <p className="text-[9px] text-green-300 uppercase font-bold">Bajas</p>
                  </div>
                </div>

                {/* Resumen Ejecutivo Restaurado */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full shadow-[0_0_15px_rgba(14,165,233,0.5)] ${stats.total > 0 && stats.resueltos === stats.total ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-sky-500'}`}></div>
                  <h3 className="text-[11px] font-bold text-sky-500 uppercase tracking-[0.5em] mb-5">Executive Summary // QA Analysis</h3>
                  <p className="text-2xl font-light text-slate-100 italic leading-relaxed max-w-5xl">"{summary}"</p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-800 pb-10">
                  <div>
                    <h2 className="text-6xl font-black text-white tracking-tighter uppercase">Audit Report</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-[10px] text-slate-500 mono font-bold uppercase tracking-[0.3em]">
                        Reference ID: <span className="text-slate-300">{currentAuditId || 'MODO_LOCAL'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                    <button onClick={handleCopyAll} className={`col-span-2 md:w-auto px-4 py-3 ${allCopied ? 'bg-emerald-600' : 'bg-slate-700'} text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-600 transition-all flex justify-center`}>
                      {allCopied ? '✅ Copiado' : '📑 Copiar Todo'}
                    </button>
                    <button onClick={exportPDF} className="px-4 py-3 bg-white text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-sky-500 hover:text-white transition-all flex justify-center">
                      📄 PDF
                    </button>
                    <button onClick={exportMarkdown} className="px-4 py-3 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex justify-center">
                      📝 MD
                    </button>
                    <button onClick={exportLatex} className="px-4 py-3 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all flex justify-center">
                      🔬 LaTeX
                    </button>
                    <button onClick={exportCSV} className="px-4 py-3 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all flex justify-center">
                      📊 CSV
                    </button>
                    <button onClick={exportDetailedJSON} className="col-span-2 md:col-span-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex justify-center">
                      🔧 JSON
                    </button>
                  </div>
                </div>

                <IssueTable issues={issues} onToggleDone={handleToggleDone} onUpdateFix={handleUpdateFix} onCopyIssue={handleCopyIssue} />
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-12 flex justify-between items-center text-slate-600">
        <div className="flex items-center gap-4">
          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-slate-700'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Synapse Terminal // Core v4.5</span>
        </div>
        <div className="flex gap-8 items-center">
          {session && (
            <button
              onClick={() => supabase?.auth.signOut()}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors border border-slate-800 px-3 py-1 rounded"
            >
              Cerrar Sesión ({session.user.email})
            </button>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">Protocolo: SSL_ENCRYPTED</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">&copy; {new Date().getFullYear()} Flux Engineering</span>
        </div>
      </footer>
    </div >
  );
};

export default AppWrapper;
