import { test, expect } from '@playwright/test';
import { LoginPage }     from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PimPage }       from '../pages/PimPage';
import { logJiraBugViaMCP } from '../helpers/jiraMcpLogger';

test('OrangeHRM — Self-Healing + Jira Auto-Logging E2E Demo', async ({ page }) => {

    const loginPage     = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const pimPage       = new PimPage(page);

    // ── Step 1: Login ────────────────────────────────────────────────────────
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');

    // ── Step 2: Verify Dashboard chart loads ─────────────────────────────────
    await dashboardPage.waitForChartLoad();

    // ── Step 3: Self-Healing Navigation Demo ─────────────────────────────────
    // Primary selector 'a[href*="broken_pim"]' will fail intentionally.
    // Healer dynamically finds a:has-text("PIM") from the DOM and recovers.
    await dashboardPage.navigateToPIM();

    // ── Step 4: Add Employee via PIM ─────────────────────────────────────────
    await pimPage.addNewEmployee('Automation', 'SDET');
    await pimPage.verifyEmployeeCreated('Automation', 'SDET');

    // ── Step 5: Return to Dashboard for Visual Regression ────────────────────
    await dashboardPage.goto();
    await dashboardPage.waitForChartLoad();

    // ── Step 6: Visual Regression — Intentional failure to demo Jira logging ─
    // Baseline captured before employee add; chart data changes after add,
    // guaranteeing a pixel diff on every run to trigger Jira auto-logging.
    try {
        await expect(dashboardPage.chartWidget).toHaveScreenshot(
            'dashboard-chart-baseline.png',
            { maxDiffPixels: 0, threshold: 0, animations: 'disabled' }
        );
        console.log('[VISUAL] Snapshot matched baseline — no regression detected.');
    } catch (visualError: any) {
        console.error('[VISUAL REGRESSION] Pixel diff detected. Logging bug to Jira...');
        await logJiraBugViaMCP({
            summary: '[Visual Regression] Dashboard chart changed after employee creation',
            description: [
                `Step: Visual baseline comparison post employee add`,
                `URL: ${page.url()}`,
                `Reason: Pixel diff exceeded threshold (maxDiffPixels=0, threshold=0)`,
                `Error: ${visualError.message}`,
            ].join('\n'),
        });
        console.log('[JIRA] Bug logged successfully. Failing test.');
        throw visualError;
    }
});
