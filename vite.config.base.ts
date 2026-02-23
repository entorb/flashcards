import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import type { UserConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export interface AppConfig {
  basePath: string
  appTitle: string
  description: string
  themeColor: string
  srcDir: string
  serverPort: number
  previewPort: number
}

export const baseViteConfig: UserConfig = {
  build: {
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    target: 'esnext'
  },

  optimizeDeps: {
    exclude: [
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
      'unplugin-vue-router/runtime'
    ],
    include: ['vue', 'vue-router', 'quasar']
  }
}

// Plugin factory functions
export function getVuePlugin() {
  return Vue({ template: { transformAssetUrls } })
}

export function getQuasarPlugin(sassVariablesPath: string) {
  // Quasar vite plugin tree-shaking optimization:
  // - Only the Quasar CSS and SASS variables are globally imported
  // - Components auto-imported by Vue based on actual template usage
  // - Combined with explicit plugin imports (Dialog, Notify in main.ts),
  //   only used components are bundled, significantly reducing bundle size
  return quasar({
    sassVariables: sassVariablesPath
  })
}

export function getVueRouterPlugin(dtsPath: string) {
  return VueRouter({ dts: dtsPath })
}

export function getVitePwaPlugin(config: AppConfig) {
  return VitePWA({
    registerType: 'prompt',
    includeAssets: [
      'favicon.ico',
      'apple-touch-icon.png',
      'android-chrome-192x192.png',
      'android-chrome-512x512.png'
    ],
    manifest: {
      name: config.appTitle,
      short_name: config.appTitle,
      description: config.description,
      theme_color: config.themeColor,
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: `/${config.basePath}/`,
      start_url: `/${config.basePath}/`,
      icons: [
        {
          src: `/${config.basePath}/android-chrome-192x192.png`,
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: `/${config.basePath}/android-chrome-512x512.png`,
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: `/${config.basePath}/apple-touch-icon.png`,
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
            }
          }
        }
      ]
    }
  })
}
