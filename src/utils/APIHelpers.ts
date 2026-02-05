import { APIRequestContext, expect } from '@playwright/test';

export class APIHelpers {
    private request: APIRequestContext;
    private baseURL: string;

    constructor(request: APIRequestContext, baseURL: string) {
        this.request = request;
        this.baseURL = baseURL;
    }

    async getEmployee(employeeId: string) {
        // OrangeHRM internal API often used by the frontend
        // Adjust endpoint based on actual network calls if needed. 
        // Example: /web/index.php/api/v2/pim/employees?employeeId=...
        // Fetch employees using the provided URL structure
        const response = await this.request.get(`${this.baseURL}/web/index.php/api/v2/pim/employees`, {
            params: {
                limit: 50,
                offset: 0,
                model: 'detailed',
                employeeId: employeeId,
                includeEmployees: 'onlyCurrent',
                sortField: 'employee.firstName',
                sortOrder: 'ASC'
            }
        });

        // Return null or data
        if (response.status() === 200) {
            const data = await response.json();
            console.log(`API Response: ${JSON.stringify(data)}`);
            return data;
        } else {
            // Log error or return null
            console.log(`API Fetch failed: ${response.status()}`);
            return null;
        }
    }

    async verifyEmployeeExists(employeeId: string, expectedFirstName: string) {
        // Use the getEmployee method which now fetches the list using the UI-authenticated context
        const data = await this.getEmployee(employeeId);
        expect(data, "API response should be valid").toBeTruthy();

        // The API returns { data: [...], meta: ... }
        const employees = data.data;
        expect(Array.isArray(employees), "Data should contain an array of employees").toBeTruthy();

        const foundEmployee = employees.find((e: any) => e.employeeId === employeeId);

        if (foundEmployee) {
            console.log(`Employee found via API: ${JSON.stringify(foundEmployee)}`);
            expect(foundEmployee.firstName).toBe(expectedFirstName);
        } else {
            // For debugging, print IDs found
            const foundIds = employees.map((e: any) => e.employeeId);
            console.log(`Employee ${employeeId} not found in first 50 results. Found IDs: ${foundIds.join(', ')}`);
            expect(foundEmployee, `Employee ${employeeId} should exist via API`).toBeTruthy();
        }
    }

    async verifyEmployeeDeleted(employeeId: string) {
        const data = await this.getEmployee(employeeId);
        // If data.data is empty or employee not found
        const employees = data?.data || [];
        const exists = employees.some((e: any) => e.employeeId === employeeId);
        expect(exists, `Employee ${employeeId} should NOT exist via API`).toBeFalsy();
    }
}
