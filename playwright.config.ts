import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:6007',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use CSS pixels (1x) so screenshots match Figma exports (also 1x).
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

  // Starts Storybook automatically when running tests.
  // In dev mode it reuses the already-running server on :6007.
  webServer: {
    command: 'npm run storybook -- --port 6007 --no-open --ci',
    url: 'http://localhost:6007',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
