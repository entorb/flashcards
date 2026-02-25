import { defineConfig } from 'cypress'

export default defineConfig({
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    allowCypressEnv: false
  }
})
