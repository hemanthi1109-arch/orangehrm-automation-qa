# OrangeHRM Automation Framework

## Overview
This repository contains the solution for the Senior QA Automation Engineer Technical Test. It demonstrates a scalable automation architecture using Playwright, TypeScript, and Page Object Model patterns, automating the employee lifecycle on the OrangeHRM platform.

## Features implemented
- **Part 1: Advanced End-to-End Automation**: Complete employee lifecycle (Create, Read, Update, Delete) automated.
- **Part 2: Framework Design**:
  - **Page Object Model (POM)**: Located in `src/pages/`.
  - **Environment Configuration**: Uses `.env` files.
  - **Reusable Utilities**: API Helpers and Test Data generators.
- **Part 3: CI/CD**: GitHub Actions workflow configured in `.github/workflows/main.yml`.
- **Part 4: Test Stability**:
  - Auto-retries configured in `playwright.config.ts`.
  - Smart waiting and tracing enabled.
  - Screenshots and videos on failure.
- **Part 5: Performance Testing**: K6 scripts located in `k6/`.
- **Part 6: Reporting**: HTML reports generated automatically.

## Project Structure
```
├── .github/workflows/   # CI/CD Pipeline configuration
├── k6/                  # Performance test scripts
├── src/
│   ├── fixtures/        # Test data providers
│   ├── pages/           # Page Object Model classes
│   ├── tests/           # Test specifications
│   └── utils/           # Helper utilities (API, etc.)
├── playwright.config.ts # Framework configuration
└── package.json         # Dependencies and scripts
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   The project supports multiple environments (`dev`, `qa`, `stage`), controlled via the `TEST_ENV` environment variable.

   - **Configuration Files**: Located in `src/testData/envConfig/`.
     - `dev.json`
     - `qa.json` (Default)
     - `stage.json`
   
   - **Switching Environments**:
     You can switch environments by setting the `TEST_ENV` variable. The `package.json` includes pre-configured scripts for this using `cross-env` to ensure compatibility across operating systems.
     
     **Command Line Usage:**
     ```bash
     # Run in QA (Default)
     npm run test:qa
     
     # Run in Development
     npm run test:dev
     
     # Run in Staging
     npm run test:stage
     ```

4. **Test Data Management**
   The framework separates static verification data from dynamic runtime data.
   
   - **Static Data (`src/testData/data.json`)**: Contains immutable verification points like:
     - Application System Messages (e.g., "Successfully Saved")
     - Field Labels and Placeholders
     - Role Access configurations
     
   - **Environment Data (`src/testData/envConfig/*.json`)**: Stores environment-specific details:
     - Base URLs
     - User Credentials (Admin/Standard)
     
   - **Dynamic Data (`src/utils/test-data.ts`)**:
     - `TestData.generateEmployee()`: Creates unique employee datasets (Random IDs, timestamps) for every test run to prevent data collision and ensure test independence.

5. **Running Tests**
   The `package.json` includes several distinct scripts for running tests in different environments:

   - **Run all tests (QA Env by default)**:
     ```bash
     npm run test
     ```
   - **Run with specific environment**:
     ```bash
     npm run test:dev    # Dev environment
     npm run test:stage  # Stage environment
     ```
   - **Run in UI mode (Interactive)**:
     ```bash
     npm run test:ui
     ```
   - **Run API specific tests**:
     ```bash
     npm run test:api
     ```
   - **Debug mode**:
     ```bash
     npm run test:debug
     ```
   - **View Report**:
     ```bash
     npm run report
     ```

## Performance Testing (K6)
This project includes performance tests using **K6** located in the `k6/` directory.

### Prerequisites
- Install K6 on your machine (e.g., `choco install k6` on Windows, or via Homebrew/apt).

### Available Scripts
1. **Login Performance Test**:
   Simulates 20 concurrent users logging into the application.
   ```bash
   npm run k6:login
   ```

2. **Create Employee Performance Test**:
   Simulates users creating employees. This script handles:
   - **Authentication**: Logs in to obtain session cookies.
   - **CSRF Token Handling**: Dynamically extracts CSRF tokens (supports standard hidden inputs and Vue.js component patterns) to ensure API requests succeed.
   - **Validation**: Verifies successful employee creation (HTTP 200).
   
   ```bash
   npm run k6:create
   ```

## Key Design Decisions
1. **Hybrid Verification**: The framework uses both UI interactors and API calls (`APIHelpers`) to verify data state, ensuring a more robust test that confirms backend persistence, not just frontend display.
2. **Abstract BasePage**: A base class abstracts common page interactions (waits, navigation), reducing code duplication.
3. **Data Isolation**: Test data is generated dynamically (`TestData.generateEmployee()`) to prevent data collision between parallel test runs.

## Flaky Test Strategy
### Detection
- **Retries**: Configured to retry once locally and twice in CI to catch intermittent failures.
- **Tracing**: Full trace recording on first retry helps identify network flakes or race conditions.
- **Annotations**: Using custom annotations or tags for tests known to be unstable.

### Mitigation
- **Smart Waits**: Relying on auto-waiting locators (`getByRole`, `getByText`) rather than hard timeouts (`waitForTimeout`).
- **State Cleanup**: Ensuring data created is unique or cleaned up to avoid "state leakage" between tests.
- **Environmental Stabilization**: Running tests in Docker containers (via CI) ensures consistent environment variables and browser versions.
