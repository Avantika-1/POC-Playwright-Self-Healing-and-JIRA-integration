import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('OrangeHRM Login Functionality Tests', () => {

    // Fresh login test karne ke liye default saved storageState bypass kar rahe hain
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC01 - Successful Login with Valid Credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('Admin', 'admin123');
        
        await expect(page).toHaveURL(/.*dashboard/);
        await page.locator('.oxd-topbar-header-title').waitFor({ state: 'attached', timeout: 10000 });
        await expect(page.locator('.oxd-topbar-header-title')).toBeVisible({ timeout: 10000 });
    });
});