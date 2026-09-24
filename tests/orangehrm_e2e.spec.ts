import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PimPage } from '../pages/PimPage';
import { clickWithSelfHealing } from '../helpers/selfHealer';
import { logJiraBugViaMCP } from '../helpers/jiraMcpLogger';

test('OrangeHRM Visual & Self-Healing E2E Workflow (POM)', async ({ page }) => {
    // 1. Initialize Page Classes
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const pimPage = new PimPage(page);

    // 2. Perform UI Login via POM
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');

    // 3. Verify Dashboard Access
    await dashboardPage.waitForChartLoad();

    // 4. Self-Healing Navigation
    const brokenPrimaryLink = 'a[href*="pim/invalid_broken_link"]';
    const validFallbackLink = 'a[href*="viewPimModule"]';

    await clickWithSelfHealing(
        page, 
        brokenPrimaryLink, 
        validFallbackLink, 
        'PIM Navigation Menu Link'
    );

    // 5. Add Employee via POM
    await pimPage.addNewEmployee('Automation', 'TS_SDET');

    // 6. Return to Dashboard & Assert Visual Baseline
    await dashboardPage.goto();
    await dashboardPage.waitForChartLoad();

    // [INTENTIONAL FAILURE] Forced visual diff to demonstrate Jira auto-logging
    // Uses a mismatched baseline to guarantee a visual failure every run
    try {
        await expect(dashboardPage.chartWidget).toHaveScreenshot('dashboard-chart-baseline.png', {
            maxDiffPixels: 0,
            threshold: 0,
            animations: 'disabled'
        });
        console.log('[SUCCESS] Visual snapshot matched baseline!');
    } catch (visualError: any) {
        console.error('[VISUAL BUG DETECTED] Snapshot mismatch found. Logging bug to Jira...');
        await logJiraBugViaMCP({
            summary: '[Visual Regression] Dashboard Chart mismatch after employee add',
            description: `Visual regression detected in E2E workflow.\n\nURL: ${page.url()}\nStep: After adding new employee via PIM\nReason: Pixel diff exceeded threshold (maxDiffPixels=0)\n\nError: ${visualError.message}`
        });
        console.log('[JIRA] Bug logged. Re-throwing to mark test as FAILED.');
        throw visualError;
    }
});
