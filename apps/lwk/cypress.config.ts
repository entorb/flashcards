import { defineConfig } from 'cypress'

import baseConfig from '../../cypress.config.base'

import { BASE_PATH } from './src/constants'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: `http://localhost:5175/${BASE_PATH}/`,
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
})
