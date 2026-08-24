import { defineConfig, mergeConfig } from 'vitest/config'

import { getVitestConfig } from '../../vitest.config.base.ts'

export default defineConfig(
  mergeConfig(getVitestConfig(import.meta.url), {
    test: {
      exclude: ['dist/**', 'e2e/**', 'node_modules/']
    }
  })
)
