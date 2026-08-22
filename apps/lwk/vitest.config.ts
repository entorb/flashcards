import { defineConfig } from 'vitest/config'

import { getVitestConfig } from '../../vitest.config.base.ts'

export default defineConfig(getVitestConfig(import.meta.url))
