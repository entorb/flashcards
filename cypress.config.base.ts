import { defineConfig } from 'cypress'

export default defineConfig({
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    allowCypressEnv: false,
    defaultCommandTimeout: 8000,
    retries: {
      runMode: process.env.CI ? 2 : 0,
      openMode: 0
    }
  }
})
