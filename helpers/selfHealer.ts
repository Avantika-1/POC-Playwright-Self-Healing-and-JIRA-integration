import { Page } from '@playwright/test';
import { logJiraBugViaMCP } from './jiraMcpLogger';

export async function clickWithSelfHealing(
    page: Page,
    primarySelector: string,
    fallbackSelector: string,
    elementName: string
): Promise<void> {
    try {
        await page.click(primarySelector, { timeout: 3000 });
        console.log(`[SUCCESS] Clicked '${elementName}' using primary selector.`);
    } catch {
        console.warn(`[HEALING] Primary failed for '${elementName}'. Trying fallback: ${fallbackSelector}`);
        try {
            await page.click(fallbackSelector, { timeout: 5000 });
            console.log(`[HEALED] Successfully clicked '${elementName}' via fallback.`);
        } catch (fallbackError) {
            console.error(`[SELF-HEAL FAILED] Both selectors failed for '${elementName}'. Logging to Jira...`);
            await logJiraBugViaMCP({
                summary: `[Self-Heal Failure] '${elementName}' not clickable via any selector`,
                description: `Primary: ${primarySelector}\nFallback: ${fallbackSelector}\nURL: ${page.url()}\nError: ${(fallbackError as Error).message}`
            });
            throw new Error(`[SELF-HEAL FAILED] Neither primary nor fallback worked for '${elementName}'.`);
        }
    }
}
