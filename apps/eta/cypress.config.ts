import { defineConfig } from 'cypress'

import baseConfig from '../../cypress.config.base'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'http://localhost:5176/fc-eta/'
  }
})
