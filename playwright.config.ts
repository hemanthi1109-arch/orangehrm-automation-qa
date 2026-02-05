import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { EnvManager } from './src/utils/EnvManager';

// Read from environment-specific .env file
const testEnv = process.env.TEST_ENV || 'qa';
dotenv.config({ path: path.resolve(__dirname, `.env.${testEnv}`) });
console.log(`Loading environment: ${testEnv.toUpperCase()} from .env.${testEnv}`);

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Part 4: Retry logic - Robust on CI
  workers: process.env.CI ? 2 : undefined, // Part 3: Parallelization - Use more workers on CI
  reporter: [
    ['html'], // Part 6: HTML test reports
    ['list']
  ],
  use: {
    baseURL: EnvManager.getTestData().url,
    trace: 'on-first-retry', // Part 4: Smart waiting mechanisms (trace helps debug)
    screenshot: 'only-on-failure', // Part 4: Screenshot capture on failures
    video: 'retain-on-failure', // Part 6: Review videos on failure
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
