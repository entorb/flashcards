import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173/',
    testIdAttribute: 'data-cy',
    trace: 'on-first-retry'
  }
})
