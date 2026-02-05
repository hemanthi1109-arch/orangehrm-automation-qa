import { BasePage } from './BasePage';
import { Page, expect } from '@playwright/test';

export class LoginPage extends BasePage {
    private usernameInput = this.page.locator("input[name='username']");
    private passwordInput = this.page.locator("input[name='password']");
    private loginButton = this.page.locator("button[type='submit']");
    private userDropdown = this.page.locator(".oxd-userdropdown-name");
    private logoutLink = this.page.getByRole('menuitem', { name: 'Logout' });

    constructor(page: Page) {
        super(page);
    }

    async navigate() {
        await this.page.goto('/');
    }

    async login(username: string, pass: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }

    async isLoggedIn() {
        await expect(this.userDropdown).toBeVisible();
    }

    async logout() {
        await this.userDropdown.click();
        await this.logoutLink.click();
        await expect(this.usernameInput).toBeVisible();
    }

    async verifyRoleAccess(moduleName: string, levelName: string) {
        // Navigate to Admin Module (or generic module based on input?)
        // For now, specifically for Admin as requested, but we generally verify breadcrumbs here.
        // Assuming the click happens before or part of this? 
        // The user request implies "use this dom Role validation".
        // I'll assume navigation happens here or before. I'll add the navigation to "Admin" here to be safe and complete.

        await this.page.getByRole('link', { name: moduleName }).click();

        const moduleHeader = this.page.locator('.oxd-topbar-header-breadcrumb-module');
        await expect(moduleHeader).toHaveText(moduleName);
        await expect(moduleHeader).toBeVisible();

        const levelHeader = this.page.locator('.oxd-topbar-header-breadcrumb-level');
        await expect(levelHeader).toHaveText(levelName);
        await expect(levelHeader).toBeVisible();
    }
}
