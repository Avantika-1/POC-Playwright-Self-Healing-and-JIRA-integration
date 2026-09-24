import { Page, Locator } from '@playwright/test';

export class PimPage {
    readonly page: Page;
    readonly addButton: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addButton = page.locator('button:has-text("Add")');
        this.firstNameInput = page.locator('input[name="firstName"]');
        this.lastNameInput = page.locator('input[name="lastName"]');
        this.saveButton = page.locator('button[type="submit"]');
    }

    async addNewEmployee(firstName: string, lastName: string) {
        await this.addButton.click();
        
        // Loader fully disappear hone ka wait karein
        await this.page.locator('.oxd-form-loader').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
        
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Click se pehle verify karein ki button par koi overlay pointer intercept nahi ho raha
        await this.saveButton.waitFor({ state: 'visible' });
        await this.saveButton.click();
        
        // Wait for dynamic save call to complete
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }
}