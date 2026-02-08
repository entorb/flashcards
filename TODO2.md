## 3. Code Duplication & Simplification

### 3.1 Extract Vite Config Factory

**Current:** 3 nearly identical vite configs (only BASE_PATH, APP_TITLE, ports differ)

**Solution:** Create `vite.config.factory.ts`:

```typescript
// vite.config.factory.ts
import { fileURLToPath } from 'node:url'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, mergeConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { baseViteConfig } from './vite.config.base'

interface AppConfig {
  basePath: string
  appTitle: string
  description: string
  themeColor: string
  serverPort: number
  previewPort: number
  srcDir: string
}

export function createAppViteConfig(config: AppConfig) {
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
        Vue({ template: { transformAssetUrls } }),
        quasar({
          sassVariables: fileURLToPath(
            new URL(`${config.srcDir}/quasar-variables.sass`, import.meta.url)
          )
        }),
        VueRouter({ dts: `${config.srcDir}/typed-router.d.ts` }),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png'],
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
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  }
                }
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL(config.srcDir, import.meta.url))
        }
      }
    })
  )
}
```

**Then each app:**

```typescript
// apps/1x1/vite.config.ts
import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-1x1',
  appTitle: "Vyvit's 1x1 Spiel",
  description: '1x1 üben mit Vyvit dem Murmeltier und seinem Lernkastensystem',
  themeColor: '#1976d2',
  serverPort: 5173,
  previewPort: 4173,
  srcDir: './src'
})
```
