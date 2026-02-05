import { test, expect } from '../../fixtures/pom-fixtures';
import { TestData } from '../../utils/test-data';

// Run tests in serial mode as they depend on the shared state (created employee)

test.describe.configure({ mode: 'serial' });

test.describe('Employee Lifecycle Management', () => {
    // Shared state between tests
    let employeeData = TestData.generateEmployee();
    const userPassword = 'Password@123'; // Specific password for the test user

    // Ensure login before each test
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
        await loginPage.login(TestData.user.username, TestData.user.password);
        await loginPage.isLoggedIn();
    });

    test('1. Authentication Success', async ({ loginPage }) => {
        await loginPage.isLoggedIn();
    });

    test('2. Create Employee with Login Details', async ({ pimPage, apiHelpers }) => {
        await pimPage.navigateToPIM();
        await pimPage.addEmployee(employeeData.firstName, employeeData.lastName, employeeData.id, {
            username: employeeData.lastName, // Use lastName as username for uniqueness
            password: userPassword
        });

        // Validation: Verify Employee in List
        await pimPage.searchEmployeeById(employeeData.id);
        await pimPage.verifyEmployeeExists(employeeData.firstName, employeeData.lastName);

    });

    test('3. API Level Verification', async ({ apiHelpers }) => {
        await test.step('Verify employee existence via API', async () => {
            await apiHelpers.verifyEmployeeExists(employeeData.id, employeeData.firstName);
        });
    });

    test('4. Role/User Validation (Login Check)', async ({ loginPage }) => {
        await loginPage.verifyRoleAccess(TestData.roleValidation.module, TestData.roleValidation.level);
        console.log('Role Validation: Admin Access Verified via Breadcrumbs');
    });

    test('5. Update Employee Details', async ({ pimPage }) => {
        const updatedLastName = employeeData.lastName + '_Upd';
        await pimPage.navigateToPIM(); // Ensure we are on PIM
        await pimPage.searchEmployeeById(employeeData.id);
        await pimPage.editEmployee(employeeData.id, updatedLastName);

        // Update local state
        employeeData.lastName = updatedLastName;
    });

    test('6. Delete Employee', async ({ pimPage }) => {
        await pimPage.navigateToPIM();
        await pimPage.deleteEmployee(employeeData.id);
    });


});
