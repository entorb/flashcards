import { defineConfig } from '@playwright/test'

import basePlaywrightConfig from '../../playwright.config.base'

import { BASE_PATH } from './src/constants'

export default defineConfig({
  ...basePlaywrightConfig,
  testDir: './playwright/tests',
  use: {
    ...basePlaywrightConfig.use,
    baseURL: `http://localhost:5178/${BASE_PATH}/`
  },
  webServer: {
    command: 'pnpm dev',
    url: `http://localhost:5178/${BASE_PATH}/`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
})
