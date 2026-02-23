import { TEXT_DE, migrateStorageKeys } from '@flashcards/shared'
import { Dialog, Notify, Quasar } from 'quasar'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Migrate storage keys from old prefix to new prefix
// TODO: Remove this migration call after 01.07.2026
migrateStorageKeys('lwk-', 'fc-lwk-')

const app = createApp(App)

// Configure Quasar with tree-shaking optimization:
// - Only essential plugins are imported (Dialog, Notify)
// - Components are auto-imported by Vue based on template usage
// - This significantly reduces bundle size through tree-shaking
app.use(Quasar, {
  plugins: {
    Dialog,
    Notify
  }
})

app.use(router)

app.mount('#app')

// Register PWA service worker after app is mounted

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Prompt user before reloading to avoid data loss
    Dialog.create({
      message: TEXT_DE.shared.pwa.update.confirmMessage,
      cancel: true,
      persistent: true
    }).onOk(() => {
      void updateSW(true)
    })
  }
})
