import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface JiraIssuePayload {
    summary: string;
    description: string;
    projectKey?: string;
}

export async function logJiraBugViaMCP(payload: JiraIssuePayload): Promise<void> {
    const domain    = process.env.JIRA_DOMAIN;
    const email     = process.env.JIRA_EMAIL;
    const token     = process.env.JIRA_API_TOKEN;
    const projectKey = payload.projectKey ?? process.env.JIRA_PROJECT_KEY ?? 'AR';

    if (!domain || !email || !token) {
        console.error('[JIRA ERROR] Missing JIRA_DOMAIN, JIRA_EMAIL or JIRA_API_TOKEN in .env — skipping Jira log.');
        return;
    }

    const adfBody = {
        fields: {
            project:     { key: projectKey },
            summary:     payload.summary,
            issuetype:   { name: 'Bug' },
            description: {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: payload.description }],
                }],
            },
        },
    };

    try {
        const response = await axios.post(
            `https://${domain}/rest/api/3/issue`,
            adfBody,
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
                    Accept:        'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`[JIRA SUCCESS] Bug created: ${response.data.key} — ${payload.summary}`);
    } catch (error: any) {
        console.error('[JIRA ERROR] Failed to create issue:', error.response?.data ?? error.message);
    }
}
