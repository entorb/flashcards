// Plugins
import { fileURLToPath } from 'node:url'

import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, mergeConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Utilities

import { baseViteConfig } from '../../vite.config.base'

// Hardcoded constants to avoid Node.js ESM resolution issues in vite.config
const BASE_PATH = 'fc-lwk'
const APP_TITLE = "Eisi's Lernwörter"

// https://vite.dev/config/
export default mergeConfig(
  baseViteConfig,
  defineConfig({
    base: `/${BASE_PATH}/`,
    server: {
      port: 5175,
      strictPort: true
    },
    preview: {
      port: 4175,
      strictPort: true
    },
    plugins: [
      Vue({
        template: { transformAssetUrls }
      }),
      quasar({
        sassVariables: fileURLToPath(new URL('./src/quasar-variables.sass', import.meta.url))
      }),
      VueRouter({
        dts: 'src/typed-router.d.ts'
      }),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png'],
        manifest: {
          name: APP_TITLE,
          short_name: APP_TITLE,
          description: 'Rechtschreibung üben mit Eisi dem Eisbären',
          theme_color: '#00bcd4',
          background_color: '#ffffff',
          icons: [
            {
              src: 'android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  })
)
