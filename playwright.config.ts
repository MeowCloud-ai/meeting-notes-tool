import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  webServer: {
    command: 'npx serve dist -l 4173 --no-clipboard',
    port: 4173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome-extension',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
