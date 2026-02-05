import { test, expect } from '../../fixtures/pom-fixtures';
import { TestData } from '../../utils/test-data';

test.describe('Employee API Validations', () => {
    let employeeData = TestData.generateEmployee();

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
        await loginPage.login(TestData.user.username, TestData.user.password);
        await loginPage.isLoggedIn();
    });

    test('Verify Employee Creation and Deletion via Network & API', async ({ page, pimPage, apiHelpers }) => {
        await pimPage.navigateToPIM();

        // 1. Monitor Network for Create Request (POST)
        const createPromise = page.waitForResponse(response =>
            response.url().includes('/api/v2/pim/employees') &&
            response.request().method() === 'POST' &&
            response.status() === 200
        );

        // Created via UI
        console.log(`Creating employee: ${employeeData.firstName} ${employeeData.lastName} (${employeeData.id})`);
        await pimPage.addEmployee(employeeData.firstName, employeeData.lastName, employeeData.id);

        const createResponse = await createPromise;
        const createJson = await createResponse.json();
        // The Create response usually contains the created object. Check if it matches.
        // Different implementations might return different structures, so we loosely verify success or ID
        expect(createResponse.status()).toBe(200);
        if (createJson.data && createJson.data.employeeId) {
            expect(createJson.data.employeeId).toBe(employeeData.id);
        }
        console.log('Employee Created via UI, Verified via Network Response');

        // 2. Verify existence via API Request (GET)
        await test.step('Verify employee existence via API', async () => {
            await apiHelpers.verifyEmployeeExists(employeeData.id, employeeData.firstName);
        });

        // 3. Monitor Network for Delete Request (DELETE)
        const deletePromise = page.waitForResponse(response =>
            response.url().includes('/api/v2/pim/employees') &&
            response.request().method() === 'DELETE' &&
            response.status() === 200
        );

        console.log(`Deleting employee: ${employeeData.id}`);
        await pimPage.deleteEmployee(employeeData.id);

        const deleteResponse = await deletePromise;
        expect(deleteResponse.status()).toBe(200);
        console.log('Employee Deletion via UI, Verified via Network Response');

        // 4. Verify Deletion via API
        await test.step('Verify employee deletion via API', async () => {
            await apiHelpers.verifyEmployeeDeleted(employeeData.id);
        });
    });
});
