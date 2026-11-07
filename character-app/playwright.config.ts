import { defineConfig } from '@playwright/test'

const port = process.env.ACCOUNTS_UI_PORT ?? '5173'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
    trace: 'off',
    screenshot: 'off',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
