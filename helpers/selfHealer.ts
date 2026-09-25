import { Page } from '@playwright/test';
import { logJiraBug } from './jiraRestLogger';

// Escape double-quotes in hint so interpolated selectors don't break
function escapeHint(hint: string): string {
    return hint.replace(/"/g, '\\"');
}

function buildHealingCandidates(hint: string): string[] {
    const h = escapeHint(hint);
    return [
        `a:has-text("${h}")`,
        `button:has-text("${h}")`,
        `[aria-label="${h}"]`,
        `input[placeholder="${h}"]`,
    ];
}

export async function clickWithSelfHealing(
    page: Page,
    primarySelector: string,
    elementHint: string
): Promise<void> {
    // Step 1: Try primary selector
    try {
        await page.click(primarySelector, { timeout: 3000 });
        console.log(`[PRIMARY] Clicked '${elementHint}' via primary selector.`);
        return;
    } catch {
        console.warn(`[HEALING] Primary failed for '${elementHint}'. Starting DOM-based self-healing...`);
    }

    // Step 2: Try each DOM candidate — waitFor visible handles timing, no count() pre-check
    const candidates = buildHealingCandidates(elementHint);
    for (const candidate of candidates) {
        try {
            console.log(`[HEALING] Trying candidate: ${candidate}`);
            await page.locator(candidate).first().waitFor({ state: 'visible', timeout: 5000 });
            await page.locator(candidate).first().click({ timeout: 5000 });
            console.log(`[HEALED] '${elementHint}' recovered via: ${candidate}`);

            // Log a warning to Jira — primary selector is drifting, needs attention before it fully breaks
            await logJiraBug({
                summary: `[DOM Drift Warning] Primary selector for '${elementHint}' required self-healing`,
                description: [
                    `Element: ${elementHint}`,
                    `Broken Primary: ${primarySelector}`,
                    `Recovered Via: ${candidate}`,
                    `Page URL: ${page.url()}`,
                    `Action Required: Update primary selector before it causes a full failure.`,
                ].join('\n'),
                labels: ['dom-drift', 'self-healed', 'automation'],
            });
            return;
        } catch (e: any) {
            console.warn(`[HEALING] Failed: ${candidate} — ${e.message?.split('\n')[0]}`);
        }
    }

    // Step 3: All strategies exhausted — log critical bug to Jira and fail
    const errorMsg = `Self-healing exhausted all DOM strategies for '${elementHint}'.`;
    console.error(`[SELF-HEAL FAILED] ${errorMsg}`);

    await logJiraBug({
        summary: `[Self-Heal Failure] '${elementHint}' unreachable via any DOM strategy`,
        description: [
            `Element: ${elementHint}`,
            `Primary Selector: ${primarySelector}`,
            `Candidates Tried:`,
            ...candidates.map(c => `  - ${c}`),
            `Page URL: ${page.url()}`,
        ].join('\n'),
        labels: ['self-heal-failure', 'automation', 'critical'],
    });

    throw new Error(`[SELF-HEAL FAILED] ${errorMsg}`);
}
