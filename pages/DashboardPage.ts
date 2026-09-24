import { Page, Locator } from '@playwright/test';
import { clickWithSelfHealing } from '../helpers/selfHealer';

export class DashboardPage {
    readonly page:        Page;
    readonly chartWidget: Locator;

    constructor(page: Page) {
        this.page        = page;
        // .first() prevents strict mode violation — dashboard renders multiple chart elements
        this.chartWidget = page.locator('.oxd-pie-chart').first();
    }

    async goto(): Promise<void> {
        await this.page.goto('/web/index.php/dashboard/index');
        await this.page.waitForLoadState('networkidle');
    }

    async waitForChartLoad(): Promise<void> {
        await this.chartWidget.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[DASHBOARD] Chart widget is visible.');
    }

    // Intentionally broken primary selector — demonstrates dynamic DOM self-healing via hint 'PIM'
    async navigateToPIM(): Promise<void> {
        console.log('[DASHBOARD] Navigating to PIM (self-healing demo)...');
        // Wait for sidebar nav to be fully rendered before healing attempts
        await this.page.locator('.oxd-main-menu-item').first().waitFor({ state: 'visible', timeout: 10000 });
        await clickWithSelfHealing(
            this.page,
            'a[href*="broken_pim"]',   // intentionally broken primary
            'PIM'                       // hint — healer finds a:has-text("PIM") dynamically
        );
        await this.page.waitForURL('**/pim/**');
        await this.page.waitForLoadState('networkidle');
    }
}
