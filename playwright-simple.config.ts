import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load env vars for headless runs
dotenv.config({ path: '.env.local' });

// Construct TEST_USERS_DATA on the fly when not provided, using .env.local fields
if (!process.env.TEST_USERS_DATA && process.env.TEST_HOST_EMAIL && process.env.TEST_GUEST_EMAIL) {
  const testUsers = {
    host: {
      uid: process.env.TEST_HOST_UID || 'test-host-uid',
      email: process.env.TEST_HOST_EMAIL,
      password: process.env.TEST_HOST_PASSWORD || 'password123!',
      displayName: process.env.TEST_HOST_NAME || 'Test Host'
    },
    guest: {
      uid: process.env.TEST_GUEST_UID || 'test-guest-uid',
      email: process.env.TEST_GUEST_EMAIL,
      password: process.env.TEST_GUEST_PASSWORD || 'password123!',
      displayName: process.env.TEST_GUEST_NAME || 'Test Guest'
    },
    errorTest: {
      uid: 'error-user-uid',
      email: process.env.TEST_ERROR_EMAIL || 'error@test.local',
      password: process.env.TEST_ERROR_PASSWORD || 'password123!',
      displayName: 'Error User'
    }
  };
  process.env.TEST_USERS_DATA = JSON.stringify(testUsers);
}

// Ensure TEST_BASE_URL for consistency
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/**
 * Simple Playwright Configuration for Basic Validation Tests
 * This config doesn't use global setup/teardown to avoid Firebase user creation issues
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Test timeout */
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});

