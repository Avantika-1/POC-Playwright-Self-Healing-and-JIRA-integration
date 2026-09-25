import { Page, Locator } from '@playwright/test';
import { clickWithSelfHealing } from '../helpers/selfHealer';

export class DashboardPage {
    readonly page:        Page;
    readonly chartWidget: Locator;
    readonly sidebar:     Locator;

    constructor(page: Page) {
        this.page        = page;
        this.chartWidget = page.locator('.oxd-pie-chart').first();
        this.sidebar     = page.locator('.oxd-main-menu-item').first();
    }

    async goto(): Promise<void> {
        await this.page.goto('/web/index.php/dashboard/index');
        // Wait on a concrete element instead of networkidle (avoids SPA polling flakiness)
        await this.chartWidget.waitFor({ state: 'visible', timeout: 15000 });
    }

    async waitForChartLoad(): Promise<void> {
        await this.chartWidget.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[DASHBOARD] Chart widget is visible.');
    }

    // Intentionally broken primary — demonstrates dynamic DOM self-healing via hint 'PIM'
    async navigateToPIM(): Promise<void> {
        console.log('[DASHBOARD] Navigating to PIM (self-healing demo)...');
        await this.sidebar.waitFor({ state: 'visible', timeout: 10000 });
        await clickWithSelfHealing(this.page, 'a[href*="broken_pim"]', 'PIM');
        await this.page.waitForURL('**/pim/**', { timeout: 15000 });
    }
}
