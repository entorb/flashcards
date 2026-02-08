// vite.config.factory.ts
import { join } from 'node:path'

import { defineConfig, mergeConfig, normalizePath } from 'vite'

import {
  baseViteConfig,
  getQuasarPlugin,
  getVueRouterPlugin,
  getVitePwaPlugin,
  getVuePlugin,
  type AppConfig
} from './vite.config.base'

export function createAppViteConfig(config: AppConfig) {
  // Ensure basePath is valid: non-empty and contains no slashes
  if (!config.basePath || config.basePath.includes('/')) {
    throw new Error('basePath must be non-empty and contain no slashes')
  }

  return mergeConfig(
    baseViteConfig,
    defineConfig({
      base: `/${config.basePath}/`,
      server: {
        port: config.serverPort,
        strictPort: true
      },
      preview: {
        port: config.previewPort,
        strictPort: true
      },
      plugins: [
        getVuePlugin(),
        getQuasarPlugin(join(config.srcDir, 'quasar-variables.sass')),
        getVueRouterPlugin(join(config.srcDir, 'typed-router.d.ts')),
        getVitePwaPlugin(config)
      ],
      resolve: {
        alias: {
          '@': normalizePath(config.srcDir)
        }
      }
    })
  )
}
