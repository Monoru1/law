import { defineConfig, devices } from '@playwright/test';

const localPort = process.env.LAW_E2E_PORT ?? '3000';
const localBaseUrl = `http://127.0.0.1:${localPort}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    baseURL: process.env.LAW_BASE_URL ?? localBaseUrl,
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
        command: process.env.CI
          ? `pnpm start --hostname 127.0.0.1 --port ${localPort}`
          : `pnpm dev --hostname 127.0.0.1 --port ${localPort}`,
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
