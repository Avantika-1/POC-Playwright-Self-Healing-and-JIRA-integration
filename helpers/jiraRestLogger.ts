import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface JiraIssuePayload {
    summary: string;
    description: string;
    projectKey?: string;
    labels?: string[];
}

// Build a proper ADF paragraph with hardBreak nodes between lines
// so Jira renders each line separately instead of one run-on block
function buildAdfDescription(text: string) {
    const lines = text.split('\n');
    const content: object[] = [];
    lines.forEach((line, i) => {
        content.push({ type: 'text', text: line });
        if (i < lines.length - 1) content.push({ type: 'hardBreak' });
    });
    return {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content }],
    };
}

// Search for an existing open Jira issue with the same summary to avoid duplicates
async function findExistingIssue(
    domain: string,
    authHeader: string,
    projectKey: string,
    summary: string
): Promise<string | null> {
    const jql = `project = "${projectKey}" AND summary ~ "${summary.replace(/"/g, '\\"')}" AND statusCategory != Done ORDER BY created DESC`;
    try {
        const res = await axios.get(
            `https://${domain}/rest/api/3/search`,
            {
                params: { jql, maxResults: 1, fields: 'summary,status' },
                headers: {
                    Authorization: authHeader,
                    Accept: 'application/json',
                },
            }
        );
        const issues = res.data.issues;
        return issues.length > 0 ? issues[0].key : null;
    } catch {
        return null; // if search fails, fall through to create
    }
}

// Add a comment to an existing Jira issue instead of creating a duplicate
async function addComment(
    domain: string,
    authHeader: string,
    issueKey: string,
    text: string
): Promise<void> {
    await axios.post(
        `https://${domain}/rest/api/3/issue/${issueKey}/comment`,
        {
            body: {
                type: 'doc',
                version: 1,
                content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
            },
        },
        {
            headers: {
                Authorization: authHeader,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }
    );
}

export async function logJiraBug(payload: JiraIssuePayload): Promise<void> {
    const domain     = process.env.JIRA_DOMAIN;
    const email      = process.env.JIRA_EMAIL;
    const token      = process.env.JIRA_API_TOKEN;
    const projectKey = payload.projectKey ?? process.env.JIRA_PROJECT_KEY ?? 'AR';

    if (!domain || !email || !token) {
        console.error('[JIRA] Missing JIRA_DOMAIN, JIRA_EMAIL or JIRA_API_TOKEN in .env — skipping.');
        return;
    }

    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

    // Duplicate guard: comment on existing open issue instead of creating a new one
    const existingKey = await findExistingIssue(domain, authHeader, projectKey, payload.summary);
    if (existingKey) {
        console.warn(`[JIRA] Open issue already exists: ${existingKey}. Adding comment instead of duplicate.`);
        await addComment(domain, authHeader, existingKey, `Re-occurrence detected:\n\n${payload.description}`);
        console.log(`[JIRA] Comment added to ${existingKey}.`);
        return;
    }

    // Create new bug with proper ADF description
    try {
        const response = await axios.post(
            `https://${domain}/rest/api/3/issue`,
            {
                fields: {
                    project:     { key: projectKey },
                    summary:     payload.summary,
                    issuetype:   { name: 'Bug' },
                    labels:      payload.labels ?? ['automation'],
                    description: buildAdfDescription(payload.description),
                },
            },
            {
                headers: {
                    Authorization: authHeader,
                    Accept:        'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`[JIRA] Bug created: ${response.data.key} — ${payload.summary}`);
    } catch (error: any) {
        console.error('[JIRA] Failed to create issue:', error.response?.data ?? error.message);
    }
}
