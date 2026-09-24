import { Page } from '@playwright/test';
import { logJiraBugViaMCP } from './jiraMcpLogger';

// DOM-based candidate strategies derived from elementHint at runtime
function buildHealingCandidates(hint: string): string[] {
    return [
        `a:has-text("${hint}")`,
        `button:has-text("${hint}")`,
        `[aria-label="${hint}"]`,
        `input[placeholder="${hint}"]`,
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
        console.warn(`[HEALING] Primary selector failed for '${elementHint}'. Starting DOM-based self-healing...`);
    }

    // Step 2: Dynamic DOM healing — try each candidate derived from elementHint
    const candidates = buildHealingCandidates(elementHint);
    for (const candidate of candidates) {
        try {
            // Wait for at least one match to exist in DOM before attempting click
            const count = await page.locator(candidate).count();
            console.log(`[HEALING] Trying: ${candidate} (found ${count} element(s) in DOM)`);
            if (count === 0) {
                console.warn(`[HEALING] Skipped (not in DOM): ${candidate}`);
                continue;
            }
            await page.locator(candidate).first().waitFor({ state: 'visible', timeout: 5000 });
            await page.locator(candidate).first().click({ timeout: 5000 });
            console.log(`[HEALED] '${elementHint}' recovered using dynamic selector: ${candidate}`);
            return;
        } catch (e: any) {
            console.warn(`[HEALING] Candidate failed: ${candidate} — ${e.message?.split('\n')[0]}`);
        }
    }

    // Step 3: All strategies exhausted — log to Jira and fail the test
    const errorMessage = `Self-healing exhausted all DOM strategies for '${elementHint}'.`;
    console.error(`[SELF-HEAL FAILED] ${errorMessage} Logging to Jira...`);

    await logJiraBugViaMCP({
        summary: `[Self-Heal Failure] Element '${elementHint}' not found via any DOM strategy`,
        description: [
            `Element Hint: ${elementHint}`,
            `Primary Selector: ${primarySelector}`,
            `Healing Candidates Tried:\n${candidates.map(c => `  - ${c}`).join('\n')}`,
            `Page URL: ${page.url()}`,
        ].join('\n\n'),
    });

    throw new Error(`[SELF-HEAL FAILED] ${errorMessage}`);
}
