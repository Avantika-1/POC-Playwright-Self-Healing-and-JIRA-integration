import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface JiraIssuePayload {
    summary: string;
    description: string;
    projectKey?: string;
    issueType?: string;
}

export async function logJiraBugViaMCP(issueDetails: JiraIssuePayload) {
    const jiraDomain = process.env.JIRA_DOMAIN;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    const projectKey = issueDetails.projectKey || process.env.JIRA_PROJECT_KEY || 'AR';

    if (!jiraDomain || !jiraEmail || !jiraApiToken) {
        console.error('[JIRA ERROR] Missing JIRA_DOMAIN, JIRA_EMAIL or JIRA_API_TOKEN in .env');
        return;
    }

    const url = `https://${jiraDomain}/rest/api/3/issue`;
    const authHeader = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');

    const bodyData = {
        fields: {
            project: { key: projectKey },
            summary: issueDetails.summary,
            description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: issueDetails.description }]
                    }
                ]
            },
            issuetype: { name: 'Bug' }
        }
    };

    try {
        const response = await axios.post(url, bodyData, {
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log(`[JIRA SUCCESS] Real Jira Bug Created Successfully! Issue Key: ${response.data.key}`);
    } catch (error: any) {
        console.error('[JIRA ERROR] Failed to log issue to Jira:', error.response?.data || error.message);
    }
}