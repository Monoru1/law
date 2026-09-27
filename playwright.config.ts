import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    baseURL: process.env.LAW_BASE_URL ?? 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.LAW_CHROME_PATH
      ? {
          executablePath: process.env.LAW_CHROME_PATH,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        }
      : undefined,
  },
  webServer: process.env.LAW_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev --hostname 127.0.0.1',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
