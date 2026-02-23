import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { configDefaults, type UserConfig } from 'vitest/config'

export const getVitestConfig = (rootDir: string): UserConfig => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', rootDir))
    }
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [...configDefaults.exclude, '**/*.spec.ts', 'e2e/**']
    },
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**', 'node_modules/'],
    onConsoleLog(log: string) {
      // Suppress Vue warnings about unresolved Quasar components in tests
      if (log.includes('Failed to resolve component: Q')) return false
    },
    root: fileURLToPath(new URL('./', rootDir)),
    setupFiles: ['./src/__tests__/setup.ts']
  }
})
