import { Page, Locator, expect } from '@playwright/test';
import { clickWithSelfHealing } from '../helpers/selfHealer';

export class PimPage {
    readonly page:           Page;
    readonly addButton:      Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput:  Locator;

    constructor(page: Page) {
        this.page           = page;
        this.addButton      = page.locator('button:has-text("Add")');
        this.firstNameInput = page.locator('input[name="firstName"]');
        this.lastNameInput  = page.locator('input[name="lastName"]');
    }

    async addNewEmployee(firstName: string, lastName: string): Promise<void> {
        await this.addButton.click();

        const loaderAppeared = await this.page.locator('.oxd-form-loader')
            .waitFor({ state: 'visible', timeout: 3000 })
            .then(() => true)
            .catch(() => false);

        if (loaderAppeared) {
            await this.page.locator('.oxd-form-loader').waitFor({ state: 'detached', timeout: 10000 });
        } else {
            console.log('[PIM] Form loader did not appear — form likely rendered immediately.');
        }

        await this.firstNameInput.waitFor({ state: 'visible' });
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        await clickWithSelfHealing(this.page, 'button[type="submit"]', 'Save');
        await this.page.waitForURL('**/pim/viewPersonalDetails/**', { timeout: 15000 });
        console.log(`[PIM] Employee '${firstName} ${lastName}' saved.`);
    }

    async verifyEmployeeCreated(firstName: string, lastName: string): Promise<void> {
        await expect(this.firstNameInput).toHaveValue(firstName, { timeout: 10000 });
        await expect(this.lastNameInput).toHaveValue(lastName);
        console.log(`[PIM] Verified: '${firstName} ${lastName}' profile loaded correctly.`);
    }
}
