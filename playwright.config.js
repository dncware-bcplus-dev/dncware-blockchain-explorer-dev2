// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// npm / npx injects npm_config_proxy from .npmrc into child env.
// Playwright's internal proxy-from-env reads it and routes the
// webServer health-check through a corporate proxy, which cannot
// reach 127.0.0.1 and returns HTTP 503.  Bypass for localhost.
if (!process.env.NO_PROXY) {
  process.env.NO_PROXY = '127.0.0.1,localhost';
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:8003',

    /* Collect trace when retaining on failure. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Timeout for each action */
    actionTimeout: 10000,

    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Increase timeout for Firefox due to slower startup
        actionTimeout: 20000,
        navigationTimeout: 60000,
      },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8003',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});