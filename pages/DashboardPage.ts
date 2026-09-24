import { Page, Locator } from '@playwright/test';
import { logJiraBugViaMCP } from '../helpers/jiraMcpLogger';

export class DashboardPage {
    readonly page: Page;
    readonly chartWidget: Locator;

    constructor(page: Page) {
        this.page = page;
        this.chartWidget = page.locator('.oxd-pie-chart').first();
    }

    async goto() {
        await this.page.goto('/web/index.php/dashboard/index');
        await this.page.waitForLoadState('networkidle');
    }

    async waitForChartLoad() {
        try {
            await this.chartWidget.waitFor({ state: 'visible' });
        } catch (error: any) {
            console.error('[ERROR] Element interaction failed. Dynamically logging defect to Jira...');

            // Dynamic locator name aur page details
            const targetLocator = this.chartWidget.toString();
            const currentUrl = this.page.url();

            // Completely dynamic Summary & Description directly from runtime error
            await logJiraBugViaMCP({
                summary: `[Automation Failure] Action failed on element: ${targetLocator}`,
                description: `Execution failed dynamically during test run.\n\n` +
                             `📌 Target Page: ${currentUrl}\n` +
                             `🎯 Target Locator: ${targetLocator}\n\n` +
                             `💥 Runtime Exception:\n${error.message}\n\n` +
                             `📜 Stack Trace:\n${error.stack}`
            });

            throw error;
        }
    }
}