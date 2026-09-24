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

        // Wait for add-employee form to be ready
        await this.page.locator('.oxd-form-loader').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
        await this.firstNameInput.waitFor({ state: 'visible' });

        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Self-healing save: primary is submit type, hint drives DOM fallback
        await clickWithSelfHealing(this.page, 'button[type="submit"]', 'Save');

        await this.page.waitForLoadState('networkidle').catch(() => {});
        console.log(`[PIM] Employee '${firstName} ${lastName}' saved.`);
    }

    async verifyEmployeeCreated(firstName: string, lastName: string): Promise<void> {
        // After save, OrangeHRM redirects to the employee profile — verify name fields are populated
        await expect(this.firstNameInput).toHaveValue(firstName, { timeout: 10000 });
        await expect(this.lastNameInput).toHaveValue(lastName);
        console.log(`[PIM] Verified employee '${firstName} ${lastName}' was created successfully.`);
    }
}
