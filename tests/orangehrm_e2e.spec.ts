import { test, expect }        from '@playwright/test';
import { LoginPage }            from '../pages/LoginPage';
import { DashboardPage }        from '../pages/DashboardPage';
import { PimPage }              from '../pages/PimPage';
import { logJiraBug }           from '../helpers/jiraRestLogger';
import { generateEmployeeData } from '../helpers/dataGenerator';

test.describe('OrangeHRM E2E Demo @demo', () => {

    // ── Test 1: Self-Healing Navigation ──────────────────────────────────────
    test('Self-Healing — PIM navigation recovers from broken selector', async ({ page }) => {
        const loginPage     = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);
        const pimPage       = new PimPage(page);
        const employee      = generateEmployeeData();

        console.log(`[DATA] Generated employee: ${employee.fullName} (runId: ${employee.runId})`);

        await loginPage.goto();
        await loginPage.login();
        await dashboardPage.waitForChartLoad();

        // navigateToPIM uses intentionally broken primary — healer recovers via hint 'PIM'
        await dashboardPage.navigateToPIM();
        await pimPage.addNewEmployee(employee.firstName, employee.lastName);

        try {
            await pimPage.verifyEmployeeCreated(employee.firstName, employee.lastName);
        } catch (e: any) {
            await logJiraBug({
                summary: '[Functional Bug] Employee creation verification failed',
                description: [
                    `Step: Verify employee profile after save`,
                    `URL: ${page.url()}`,
                    `Employee: ${employee.fullName} (runId: ${employee.runId})`,
                    `Error: ${e.message}`,
                ].join('\n'),
                labels: ['functional', 'pim', 'automation'],
            });
            throw e;
        }
    });

    // ── Test 2: Visual Regression → Jira Auto-Logging ────────────────────────
    // IMPORTANT: Baseline PNG must be committed to source control.
    // To regenerate: npx playwright test --project=demo --update-snapshots
    // Excluded from default CI gate — run explicitly: npx playwright test --project=demo
    test('Visual Regression — chart diff triggers Jira auto-logging @demo', async ({ page }) => {
        const loginPage     = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);
        const pimPage       = new PimPage(page);
        const employee      = generateEmployeeData();

        console.log(`[DATA] Generated employee: ${employee.fullName} (runId: ${employee.runId})`);

        await loginPage.goto();
        await loginPage.login();
        await dashboardPage.waitForChartLoad();
        await dashboardPage.navigateToPIM();
        await pimPage.addNewEmployee(employee.firstName, employee.lastName);
        await pimPage.verifyEmployeeCreated(employee.firstName, employee.lastName);

        await dashboardPage.goto();
        await dashboardPage.waitForChartLoad();

        try {
            await expect(dashboardPage.chartWidget).toHaveScreenshot(
                'dashboard-chart-baseline.png',
                { maxDiffPixels: 0, threshold: 0, animations: 'disabled' }
            );
            console.log('[VISUAL] Snapshot matched — no regression.');
        } catch (visualError: any) {
            console.error('[VISUAL REGRESSION] Diff detected. Logging to Jira...');
            await logJiraBug({
                summary: '[Visual Regression] Dashboard chart changed after employee creation',
                description: [
                    `Step: Visual baseline comparison post employee add`,
                    `URL: ${page.url()}`,
                    `Employee Added: ${employee.fullName} (runId: ${employee.runId})`,
                    `Reason: Pixel diff exceeded threshold (maxDiffPixels=0, threshold=0)`,
                    `Error: ${visualError.message}`,
                ].join('\n'),
                labels: ['visual-regression', 'dashboard', 'automation'],
            });
            console.log('[JIRA] Bug logged. Failing test.');
            throw visualError;
        }
    });
});
