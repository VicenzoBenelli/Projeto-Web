import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/e2e',
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 180000,
  expect: { timeout: 10000 },
  reporter: [['list', { printSteps: true }]],
  outputDir: process.env.E2E_OUTPUT_DIR,
  use: {
    baseURL: process.env.E2E_BASE_URL,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    browserName: 'chromium',
    ...(process.platform === 'win32' ? { channel: 'chrome' } : {}),
    trace: 'off', // Headers de autenticação não são persistidos em traces.
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'notebook', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
