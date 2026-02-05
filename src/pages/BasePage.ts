import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async wait(ms: number) {
        await this.page.waitForTimeout(ms);
    }

}
