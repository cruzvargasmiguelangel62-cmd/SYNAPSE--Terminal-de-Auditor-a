import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { analyzeIssues, generateTasks } from '../services/geminiService';
import { analyzeIssuesWithGroq, generateTasksWithGroq } from '../services/groqService';
import { Issue, Provider, Severity } from '../types';
import { MicrophoneButton } from './MicrophoneButton';
import { IssueTable } from './IssueTable';
import { useToast } from './Toast';
import { Session } from '@supabase/supabase-js';
import { exportToGitHub, exportToTrello, verifyGitHub, verifyTrello } from '../services/exportService';
import { Eye, EyeOff, ShieldCheck, Activity } from 'lucide-react';

interface MainTerminalProps {
    session: Session;
}

export const MainTerminal: React.FC<MainTerminalProps> = ({ session }) => {
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
    // GitHub Config
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const [githubToken, setGithubToken] = useState('');

    // Trello Config
    const [trelloKey, setTrelloKey] = useState('');
    const [trelloToken, setTrelloToken] = useState('');
    const [trelloListId, setTrelloListId] = useState('');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customGeminiKey, setCustomGeminiKey] = useState('');
    const [customGroqKey, setCustomGroqKey] = useState('');
    const [useSystemKey, setUseSystemKey] = useState(true);
    const [systemCredits, setSystemCredits] = useState(() => {
        const savedCount = localStorage.getItem('synapse_credits');
        return savedCount !== null ? parseInt(savedCount) : 10;
    });
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [groqKeyError, setGroqKeyError] = useState<string | null>(null);
    const [recentAudits, setRecentAudits] = useState<any[]>([]);
    const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
    const [tableCopied, setTableCopied] = useState(false);
    const [allCopied, setAllCopied] = useState(false);
    const [auditToDelete, setAuditToDelete] = useState<number | null>(null);

    const [showGHToken, setShowGHToken] = useState(false);
    const [showTrelloKey, setShowTrelloKey] = useState(false);
    const [showTrelloToken, setShowTrelloToken] = useState(false);
    const [isVerifyingGH, setIsVerifyingGH] = useState(false);
    const [isVerifyingTrello, setIsVerifyingTrello] = useState(false);

    const { addToast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isDbConnected = !!supabase;

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
        if (isDbConnected && session) {
            fetchRecentAudits();
            fetchUserConfig();
        }
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

    const fetchUserConfig = async () => {
        if (!supabase || !session) return;
        const { data, error } = await supabase
            .from('user_configs')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (data) {
            setGithubOwner(data.gh_owner || '');
            setGithubRepo(data.gh_repo || '');
            setGithubToken(data.gh_token || '');
            setTrelloKey(data.trello_key || '');
            setTrelloToken(data.trello_token || '');
            setTrelloListId(data.trello_list_id || '');
            setCustomGeminiKey(data.gemini_key || '');
            setCustomGroqKey(data.groq_key || '');
        }
    };

    const handleSaveConfig = async () => {
        if (!supabase || !session) return;
        const config = {
            user_id: session.user.id,
            gh_owner: githubOwner,
            gh_repo: githubRepo,
            gh_token: githubToken,
            trello_key: trelloKey,
            trello_token: trelloToken,
            trello_list_id: trelloListId,
            gemini_key: customGeminiKey,
            groq_key: customGroqKey,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('user_configs')
            .upsert(config, { onConflict: 'user_id' });

        if (error) {
            addToast(`Error al guardar: ${error.message}`, "error");
        } else {
            addToast("Configuración guardada de forma segura", "success");
        }
    };

    const handleVerifyGitHub = async () => {
        if (!githubToken) {
            addToast("Ingrese un token de GitHub primero", "warning");
            return;
        }
        setIsVerifyingGH(true);
        try {
            const result = await verifyGitHub(githubToken);
            addToast(`GitHub verificado: Conectado como ${result.user}`, "success");
        } catch (err: any) {
            addToast(`Error: ${err.message}`, "error");
        } finally {
            setIsVerifyingGH(false);
        }
    };

    const handleVerifyTrello = async () => {
        if (!trelloKey || !trelloToken) {
            addToast("Ingrese API Key y Token de Trello", "warning");
            return;
        }
        setIsVerifyingTrello(true);
        try {
            const result = await verifyTrello(trelloKey, trelloToken);
            addToast(`Trello verificado: Sesión de ${result.user}`, "success");
        } catch (err: any) {
            addToast(`Error: ${err.message}`, "error");
        } finally {
            setIsVerifyingTrello(false);
        }
    };


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

    const handleCopyIssue = (issue: Issue) => {
        let text = `ANÁLISIS: ${issue.title}\n`;
        text += `DESCRIPCIÓN: ${issue.desc.replace(/\t|\n/g, ' ').trim()}\n`;
        text += `ACCIÓN: ${(issue.fix || '').replace(/\t|\n/g, ' ').trim()}\n`;
        text += `ESTADO: ${issue.isDone ? 'Resuelto' : 'Pendiente'}`;
        copyToClipboard(text, () => { });
    };

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
            let response: any;
            const activeKey = useSystemKey ? undefined : (provider === 'gemini' ? customGeminiKey : customGroqKey);

            if (provider === 'gemini') {
                response = await analyzeIssues(inputText, activeKey);
            } else if (provider === 'groq') {
                response = await analyzeIssuesWithGroq(inputText, activeKey || '', 'llama-3.3-70b-versatile');
            } else {
                throw new Error('Proveedor no válido');
            }

            // validar estructura
            if (!response || !Array.isArray(response.issues)) {
                console.error('Respuesta de análisis inválida', response);
                throw new Error('El servidor no devolvió hallazgos válidos');
            }
            const respIssues: Issue[] = response.issues;

            if (useSystemKey) {
                const nextCredits = Math.max(0, systemCredits - 1);
                setSystemCredits(nextCredits);
                localStorage.setItem('synapse_credits', nextCredits.toString());
            }

            if (supabase && session) {
                if (currentAuditId) {
                    // MODO ACTUALIZACIÓN: Actualizar auditoría existente
                    const { error: updateError } = await supabase
                        .from('audits')
                        .update({
                            summary: response.summary,
                            input_text: inputText
                        })
                        .eq('id', currentAuditId);

                    if (updateError) throw updateError;

                    // Eliminar hallazgos viejos e insertar los nuevos
                    await supabase.from('issues').delete().eq('audit_id', currentAuditId);

                    const issuesToInsert = respIssues.map(i => ({
                        audit_id: currentAuditId,
                        external_id: i.id,
                        title: i.title,
                        description: i.desc,
                        category: i.category,
                        severity: i.severity,
                        fix_plan: i.fix,
                        is_done: false
                    }));

                    const { data: insertedIssues } = await supabase.from('issues').insert(issuesToInsert).select();

                    if (insertedIssues) {
                        const finalIssues = respIssues.map(i => {
                            const dbRecord = insertedIssues.find(si => si.external_id === i.id);
                            return { ...i, dbId: dbRecord?.id, isDone: false };
                        });
                        setIssues(finalIssues);
                    }
                    addToast("Auditoría actualizada correctamente", "success");
                } else {
                    // MODO NUEVO: Crear nueva auditoría
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
                        const issuesToInsert = respIssues.map(i => ({
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

                        if (insertedIssues) {
                            const finalIssues = respIssues.map(i => {
                                const dbRecord = insertedIssues.find(si => si.external_id === i.id);
                                return { ...i, dbId: dbRecord?.id, isDone: false };
                            });
                            setIssues(finalIssues);
                        }
                        addToast("Análisis guardado exitosamente", "success");
                    }
                }
                fetchRecentAudits();
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
        setCurrentAuditId(null);

        try {
            let result: any;
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

            // validar la estructura
            if (!result || !Array.isArray(result.issues)) {
                console.error('Generación de tareas retornó datos inválidos', result);
                throw new Error('El servidor no devolvió tareas válidas');
            }
            const resultIssues: Issue[] = result.issues;

            setSummary(result.summary);

            if (supabase && session) {
                if (currentAuditId) {
                    // ACTUALIZAR TAREAS EXISTENTES
                    await supabase.from('audits').update({
                        summary: `[TAREAS] ${result.summary}`,
                        input_text: inputText
                    }).eq('id', currentAuditId);

                    await supabase.from('issues').delete().eq('audit_id', currentAuditId);

                    const tasksToInsert = resultIssues.map(i => ({
                        audit_id: currentAuditId,
                        external_id: i.id,
                        title: i.title,
                        description: i.desc,
                        category: i.category,
                        severity: i.severity,
                        fix_plan: i.fix,
                        is_done: false
                    }));

                    const { data: insertedIssues } = await supabase.from('issues').insert(tasksToInsert).select();
                    if (insertedIssues) {
                        const finalIssues = resultIssues.map(i => {
                            const dbRecord = insertedIssues.find(si => si.external_id === i.id);
                            return { ...i, dbId: dbRecord?.id, isDone: false };
                        });
                        setIssues(finalIssues);
                    }
                    addToast("Tareas actualizadas", "success");
                } else {
                    // NUEVA AUDITORÍA DE TAREAS
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
                        const tasksToInsert = resultIssues.map(i => ({
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

                        if (insertedIssues) {
                            const finalIssues = resultIssues.map(i => {
                                const dbRecord = insertedIssues.find(si => si.external_id === i.id);
                                return { ...i, dbId: dbRecord?.id, isDone: false };
                            });
                            setIssues(finalIssues);
                        }
                        addToast("Lista de tareas guardada", "success");
                    }
                }
                fetchRecentAudits();
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
        }
    };

    const handleUpdateTitle = async (id: number, text: string) => {
        const issue = issues.find(i => i.id === id);
        if (!issue) return;
        setIssues(prev => prev.map(i => i.id === id ? { ...i, title: text } : i));
        if (supabase && issue.dbId) {
            await supabase.from('issues').update({ title: text }).eq('id', issue.dbId);
        }
    };

    const handleUpdateDesc = async (id: number, text: string) => {
        const issue = issues.find(i => i.id === id);
        if (!issue) return;
        setIssues(prev => prev.map(i => i.id === id ? { ...i, desc: text } : i));
        if (supabase && issue.dbId) {
            await supabase.from('issues').update({ description: text }).eq('id', issue.dbId);
        }
    };

    const handleTranscript = (text: string) => {
        setInputText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
        addToast("Dictado por voz reconocido", "info");
    };

    const handleUpdateSummary = async (text: string) => {
        setSummary(text);
        if (supabase && currentAuditId) {
            await supabase.from('audits').update({ summary: text }).eq('id', currentAuditId);
        }
    };

    const handleExportGitHub = async (issue: Issue) => {
        if (!githubOwner || !githubRepo || !githubToken) {
            addToast("Configura GitHub en el panel de ajustes", "warning");
            setShowApiConfig(true);
            return;
        }
        try {
            const url = await exportToGitHub(issue, { owner: githubOwner, repo: githubRepo, token: githubToken });
            addToast("Issue creado en GitHub", "success");
            window.open(url, '_blank');
        } catch (err: any) {
            addToast(err.message, "error");
        }
    };

    const handleExportTrello = async (issue: Issue) => {
        if (!trelloKey || !trelloToken || !trelloListId) {
            addToast("Configura Trello en el panel de ajustes", "warning");
            setShowApiConfig(true);
            return;
        }
        try {
            const url = await exportToTrello(issue, { key: trelloKey, token: trelloToken, idList: trelloListId });
            addToast("Tarjeta creada en Trello", "success");
            window.open(url, '_blank');
        } catch (err: any) {
            addToast(err.message, "error");
        }
    };

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
        e.stopPropagation();
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

            <main className="flex-1 w-full p-4 sm:p-6 lg:p-10 space-y-6 md:space-y-12 max-w-[1800px] mx-auto">
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    <div className="lg:col-span-8">
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

                        {showApiConfig && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Configuración de Llaves (API Keys)</h3>
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
                                        <div>
                                            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-2">Google Gemini API Key</label>
                                            <div className="relative">
                                                <input
                                                    type={tableCopied ? "text" : "password"}
                                                    value={customGeminiKey}
                                                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-2">Groq API Key</label>
                                            <div className="relative">
                                                <input
                                                    type={tableCopied ? "text" : "password"}
                                                    value={customGroqKey}
                                                    onChange={(e) => setCustomGroqKey(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-300 focus:border-orange-500 outline-none transition-all mono"
                                                />
                                            </div>
                                            {groqKeyError && <p className="text-red-500 text-[10px] mt-1 font-bold">{groqKeyError}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Integraciones Section */}
                                <div className="mt-8 pt-8 border-t border-slate-800 space-y-8 animate-fadeIn">
                                    {/* GitHub */}
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                            GitHub Integration
                                        </h4>
                                        <button
                                            onClick={handleVerifyGitHub}
                                            disabled={isVerifyingGH}
                                            className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded border transition-all flex items-center gap-1.5 ${isVerifyingGH ? 'animate-pulse border-slate-700 text-slate-500' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'}`}
                                        >
                                            <Activity className="w-3 h-3" />
                                            {isVerifyingGH ? 'Verificando...' : 'Verificar Conexión'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Github Owner</label>
                                            <input type="text" value={githubOwner} onChange={(e) => setGithubOwner(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none transition-all" placeholder="ej: usuario" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Repo Name</label>
                                            <input type="text" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none transition-all" placeholder="ej: mi-proyecto" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Personal Token</label>
                                            <div className="relative">
                                                <input
                                                    type={showGHToken ? "text" : "password"}
                                                    value={githubToken}
                                                    onChange={(e) => setGithubToken(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-slate-300 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="ghp_..."
                                                />
                                                <button
                                                    onClick={() => setShowGHToken(!showGHToken)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                                                >
                                                    {showGHToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trello */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.389 0H4.611C2.069 0 0 2.069 0 4.611V19.39C0 21.931 2.069 24 4.611 24h14.778C21.931 24 24 21.931 24 19.389V4.611C24 2.069 21.931 0 19.389 0zM10.8 17.4c0 .994-.806 1.8-1.8 1.8H5.4c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8H9c.994 0 1.8.806 1.8 1.8v12zm9.6-4.8c0 .994-.806 1.8-1.8 1.8h-3.6c-.994 0-1.8-.806-1.8-1.8V5.4c0-.994.806-1.8 1.8-1.8h3.6c.994 0 1.8.806 1.8 1.8v7.2z" /></svg>
                                                Trello Integration
                                            </h4>
                                            <button
                                                onClick={handleVerifyTrello}
                                                disabled={isVerifyingTrello}
                                                className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded border transition-all flex items-center gap-1.5 ${isVerifyingTrello ? 'animate-pulse border-slate-700 text-slate-500' : 'border-sky-500/30 text-sky-500 hover:bg-sky-500/10'}`}
                                            >
                                                <Activity className="w-3 h-3" />
                                                {isVerifyingTrello ? 'Verificando...' : 'Verificar Conexión'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">API Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showTrelloKey ? "text" : "password"}
                                                        value={trelloKey}
                                                        onChange={(e) => setTrelloKey(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all"
                                                    />
                                                    <button
                                                        onClick={() => setShowTrelloKey(!showTrelloKey)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                                                    >
                                                        {showTrelloKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Token</label>
                                                <div className="relative">
                                                    <input
                                                        type={showTrelloToken ? "text" : "password"}
                                                        value={trelloToken}
                                                        onChange={(e) => setTrelloToken(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all"
                                                    />
                                                    <button
                                                        onClick={() => setShowTrelloToken(!showTrelloToken)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                                                    >
                                                        {showTrelloToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">List ID</label>
                                                <input type="text" value={trelloListId} onChange={(e) => setTrelloListId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all" placeholder="ID de lista" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        onClick={handleSaveConfig}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        Guardar en Bóveda Segura
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                            {isAnalyzing && <div className="scanner-bar"></div>}
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Terminal de Entrada de Datos</label>
                                <div className="flex gap-2">
                                    <button onClick={handlePasteClipboard} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider">Pegar</button>
                                    <button onClick={handleLoadSample} className="text-[10px] bg-slate-800 hover:bg-sky-900/40 text-sky-400 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider">Demo</button>
                                    <button onClick={handleClearTerminal} className="text-[10px] bg-slate-800 hover:bg-red-900/40 text-red-400 px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider">Limpiar</button>
                                </div>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={inputText} onChange={(e) => setInputText(e.target.value)}
                                placeholder="Pegue aquí los logs de consola, reportes de Jira o descripción del fallo..."
                                className="w-full bg-slate-950/80 border border-slate-800 p-6 text-base text-slate-200 focus:border-sky-500 outline-none transition-all min-h-[260px] rounded-xl resize-none shadow-inner"
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 md:mt-8 gap-4 sm:gap-6">
                                <div className="w-full sm:w-auto">
                                    <MicrophoneButton onTranscript={handleTranscript} isListening={isListening} setIsListening={setIsListening} />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button onClick={handleGenerateTasks} disabled={isAnalyzing} className="px-8 py-4 bg-indigo-600 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50">
                                        {currentAuditId ? 'Actualizar Tareas' : 'Generar Tareas'}
                                    </button>
                                    <button onClick={handleGenerate} disabled={isAnalyzing} className="px-12 py-4 bg-sky-500 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50">
                                        {currentAuditId ? 'Actualizar Análisis' : 'Analizar Hallazgos'}
                                    </button>
                                </div>
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
                                                    {audit.isCompleted && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-tighter">DONE</span>}
                                                    <button onClick={(e) => handleDeleteAudit(e, audit.id)} className="text-slate-600 hover:text-red-500 transition-colors p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <p className="text-[9px] text-slate-600 mono font-bold">{new Date(audit.created_at).toLocaleString()}</p>
                                                <span className="text-[8px] text-sky-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 italic">Abrir</span>
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
                                        <p className="text-[9px] text-slate-700 font-medium">Active la base de datos para habilitar el historial.</p>
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

                                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden group/summary">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${stats.total > 0 && stats.resueltos === stats.total ? 'bg-emerald-500' : 'bg-sky-500'}`}></div>
                                    <h3 className="text-[10px] sm:text-[11px] font-bold text-sky-500 uppercase tracking-[0.5em] mb-4 sm:mb-5 flex justify-between items-center">
                                        <span>Executive Summary // QA Analysis</span>
                                        <span className="text-[8px] opacity-0 group-hover/summary:opacity-50 transition-opacity">Editable</span>
                                    </h3>
                                    <textarea
                                        value={summary}
                                        onChange={(e) => handleUpdateSummary(e.target.value)}
                                        className="w-full bg-transparent text-lg sm:text-2xl font-light text-slate-100 italic leading-relaxed max-w-5xl border-none focus:ring-0 outline-none resize-none overflow-hidden h-auto min-h-[100px]"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = target.scrollHeight + 'px';
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 sm:gap-8 border-b border-slate-800 pb-8 sm:pb-10">
                                    <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase">Audit Report</h2>
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
                                        <button onClick={handleCopyAll} className={`px-4 py-3 ${allCopied ? 'bg-emerald-600' : 'bg-slate-700'} text-white rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                                            {allCopied ? '✅ Copiado' : '📑 Copiar Todo'}
                                        </button>
                                        <button onClick={exportPDF} className="px-4 py-3 bg-white text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest">PDF</button>
                                        <button onClick={exportMarkdown} className="px-4 py-3 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">MD</button>
                                        <button onClick={exportCSV} className="px-4 py-3 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">CSV</button>
                                    </div>
                                </div>

                                <IssueTable
                                    issues={issues}
                                    onToggleDone={handleToggleDone}
                                    onUpdateFix={handleUpdateFix}
                                    onUpdateTitle={handleUpdateTitle}
                                    onUpdateDesc={handleUpdateDesc}
                                    onCopyIssue={handleCopyIssue}
                                    onExportGitHub={handleExportGitHub}
                                    onExportTrello={handleExportTrello}
                                />
                            </>
                        )}
                    </div>
                )}
            </main>

            <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 md:px-12 flex flex-col md:flex-row gap-6 justify-between items-center text-slate-600">
                <div className="flex items-center gap-4 order-2 md:order-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-center md:text-left">Synapse Terminal // Core v4.5</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center order-1 md:order-2 w-full md:w-auto">
                    {session && (
                        <button onClick={() => supabase?.auth.signOut()} className="w-full md:w-auto text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors border border-slate-800 px-3 py-1.5 rounded truncate max-w-[280px]">
                            Cerrar Sesión ({session.user.email})
                        </button>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">&copy; {new Date().getFullYear()} Flux Engineering</span>
                </div>
            </footer>
        </div>
    );
};
