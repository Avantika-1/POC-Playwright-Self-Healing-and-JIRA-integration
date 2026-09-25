import { Page, Locator } from '@playwright/test';
import { clickWithSelfHealing } from '../helpers/selfHealer';

export class LoginPage {
    readonly page:          Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;

    constructor(page: Page) {
        this.page          = page;
        this.usernameInput = page.locator('input[name="username"]');
        this.passwordInput = page.locator('input[name="password"]');
    }

    async goto(): Promise<void> {
        await this.page.goto('/web/index.php/auth/login');
    }

    async login(
        username = process.env.OHR_USERNAME ?? 'Admin',
        password = process.env.OHR_PASSWORD ?? 'admin123'
    ): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await clickWithSelfHealing(this.page, 'button[type="submit"]', 'Login');
        await this.page.waitForURL('**/dashboard/index', { timeout: 15000 });
    }
}
