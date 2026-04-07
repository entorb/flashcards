import { defineConfig, mergeConfig } from 'vitest/config'

import { getVitestConfig } from '../../vitest.config.base'

export default mergeConfig(
  defineConfig(getVitestConfig(import.meta.url)),
  defineConfig({
    test: {
      passWithNoTests: true
    }
  })
)
