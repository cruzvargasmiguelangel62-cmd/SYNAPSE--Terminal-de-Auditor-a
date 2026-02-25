import { Issue } from '../types';

export interface GitHubConfig {
    owner: string;
    repo: string;
    token: string;
}

export interface TrelloConfig {
    key: string;
    token: string;
    idList: string;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export const exportToGitHub = async (issue: Issue, config: GitHubConfig) => {
    const body = `### Descripci\u00f3n\n${issue.desc}\n\n### Plan de Acci\u00f3n\n${issue.fix || 'No definido'}\n\n### Prioridad\n${issue.severity}\n\n*Generado por Synapse Terminal QA*`;

    const response = await fetch(`${API_BASE}/api/export/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            owner: config.owner,
            repo: config.repo,
            token: config.token,
            title: `[QA] ${issue.title}`,
            body
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al exportar a GitHub');
    return data.url;
};

export const exportToTrello = async (issue: Issue, config: TrelloConfig) => {
    const desc = `${issue.desc}\n\n**Plan de Acci\u00f3n:**\n${issue.fix || 'No definido'}\n\n**Prioridad:** ${issue.severity}`;

    const response = await fetch(`${API_BASE}/api/export/trello`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: config.key,
            token: config.token,
            idList: config.idList,
            name: `[QA] ${issue.title}`,
            desc
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al exportar a Trello');
    return data.url;
};

export const verifyGitHub = async (token: string) => {
    const response = await fetch(`${API_BASE}/api/verify/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de verificación');
    return data;
};

export const verifyTrello = async (key: string, token: string) => {
    const response = await fetch(`${API_BASE}/api/verify/trello`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de verificación');
    return data;
};
