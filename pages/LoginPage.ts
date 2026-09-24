import {Page, Locator} from '@playwright/test';

export class LoginPage{

    readonly page:Page;
    readonly username:Locator;
    readonly password:Locator;
    readonly LoginButton:Locator;

    constructor(page:Page) {

        this.page = page;
        this.username = page.locator('input[name="username"]')
        this.password = page.locator('input[name = "password"]')
        this.LoginButton = page.locator('button[type="submit"]')
    }

    async goto() {
        await this.page.goto('/web/index.php/auth/login');
    }

    async login(user:string, pass:string){
        await this.username.fill(user);
        await this.password.fill(pass);
        await this.LoginButton.click();
        await this.page.waitForURL('**/dashboard/index');
    }
}