import { BasePage } from './BasePage';
import { Page, expect } from '@playwright/test';
import { TestData } from '../utils/test-data';

export class PIMPage extends BasePage {
    // Menu
    private pimMenuLink = this.page.getByRole('link', { name: 'PIM' });

    // Add Employee
    private addButton = this.page.getByRole('button', { name: 'Add' });
    private firstNameInput = this.page.locator('input[name="firstName"]');
    private lastNameInput = this.page.locator('input[name="lastName"]');
    // Using robust filtering for the input group with exact text match for label
    private employeeIdInput = this.page.locator('.oxd-input-group').filter({ hasText: /^Employee Id$/ }).locator('input');
    private saveButton = this.page.getByRole('button', { name: 'Save' });

    // Login Details
    private createLoginDetailsCheckbox = this.page.locator('.oxd-switch-input');
    private usernameInput = this.page.locator('.oxd-input-group').filter({ hasText: /^Username$/ }).locator('input');
    private passwordInput = this.page.locator('.oxd-input-group').filter({ hasText: /^Password$/ }).locator('input');
    private confirmPasswordInput = this.page.locator('.oxd-input-group').filter({ hasText: /^Confirm Password$/ }).locator('input');


    // Employee List / Search
    private employeeListTab = this.page.getByRole('link', { name: 'Employee List' });
    private searchEmployeeIdInput = this.page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('input');
    private searchButton = this.page.getByRole('button', { name: 'Search' });
    private confirmDeleteButton = this.page.getByRole('button', { name: 'Yes, Delete' });

    // Edit Details
    private personalDetailsHeader = this.page.getByRole('heading', { name: 'Personal Details' });

    constructor(page: Page) {
        super(page);
    }

    async navigateToPIM() {
        await this.pimMenuLink.click();
        await expect(this.page).toHaveURL(/.*pim/);
    }

    async addEmployee(firstName: string, lastName: string, id: string, loginDetails?: { username: string, password: string }) {
        await this.addButton.click();
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // ID might be pre-filled, clear and type
        await this.employeeIdInput.click();
        await this.employeeIdInput.fill(id);

        if (loginDetails) {
            await this.createLoginDetailsCheckbox.click();
            await this.usernameInput.fill(loginDetails.username);
            await this.passwordInput.fill(loginDetails.password);
            await this.confirmPasswordInput.fill(loginDetails.password);
        }

        await this.saveButton.click();

        // Wait for success toast or redirect
        await expect(this.page.getByText(TestData.messages.success.saved)).toBeVisible();
    }

    async searchEmployeeById(id: string) {
        await this.employeeListTab.click();
        await this.searchEmployeeIdInput.fill(id);
        await this.searchButton.click();
        await this.page.waitForTimeout(1000); // UI lag sometimes
    }

    async verifyEmployeeExists(firstName: string, lastName: string) {
        // Assuming table row contains text
        await expect(this.page.getByRole('row', { name: `${firstName} ${lastName}` })).toBeVisible();
    }

    async editEmployee(id: string, newLastName: string) {
        // Use the specific class for edit icon provided by user
        await this.page.getByRole('row').filter({ hasText: id }).locator('.bi-pencil-fill').click();

        // Wait for the form to appear
        await expect(this.personalDetailsHeader).toBeVisible();
        await expect(this.page.locator('.oxd-form')).toBeVisible();

        // Fill Last Name using the input name attribute
        await this.lastNameInput.fill(newLastName);

        // Click the first save button found within the form actions
        await this.page.locator('.oxd-form-actions button[type="submit"]').first().click();

        await expect(this.page.getByText(TestData.messages.success.updated)).toBeVisible();
    }

    async deleteEmployee(id: string) {
        await this.employeeListTab.click();
        await this.searchEmployeeById(id);
        // Use the specific class for delete icon
        await this.page.getByRole('row').filter({ hasText: id }).locator('.bi-trash').click();
        await this.confirmDeleteButton.click();
        await expect(this.page.getByText(TestData.messages.success.deleted)).toBeVisible();
    }
}
