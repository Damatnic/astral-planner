/**
 * Playwright Configuration for Authentication E2E Testing
 * Comprehensive end-to-end testing setup with cross-browser support
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
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
    ['junit', { outputFile: 'junit-e2e.xml' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ...(process.env.CI ? [['github']] : [['list']])
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Authentication and security headers */
    extraHTTPHeaders: {
      // Add any default headers for testing
      'X-Test-Environment': 'e2e',
    },

    /* Timeout for each action */
    actionTimeout: 15000,

    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Authentication-specific test projects */
    {
      name: 'auth-tests-chromium',
      testMatch: /auth\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // Don't use pre-authenticated state for auth tests
        // storageState: undefined,
      },
    },

    {
      name: 'auth-tests-firefox',
      testMatch: /auth\.spec\.ts/,
      use: { 
        ...devices['Desktop Firefox'],
        // Don't use pre-authenticated state for auth tests
        // storageState: undefined,
      },
    },

    /* Security testing with different configurations */
    {
      name: 'security-tests',
      testMatch: /.*security.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Security tests might need special configuration
        ignoreHTTPSErrors: false,
        // storageState: undefined,
      },
    },

    /* Performance testing */
    {
      name: 'performance-tests',
      testMatch: /.*performance.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Performance tests configuration
        // storageState: undefined,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Global test timeout */
  timeout: 60000, // 60 seconds

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000, // 10 seconds
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/e2e',

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});