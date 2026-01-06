import { defineConfig } from 'cypress'

import baseConfig from '../../cypress.config.base'

import { BASE_PATH } from './src/constants'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: `http://localhost:5173/${BASE_PATH}/`
  }
})
