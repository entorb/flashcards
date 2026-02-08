import { TEXT_DE } from '@flashcards/shared'
import { Dialog, Notify, Quasar } from 'quasar'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'

import App from './App.vue'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

app.use(Quasar, {
  plugins: {
    Dialog,
    Notify
  }
})

app.mount('#app')

// Register PWA service worker after app is mounted
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm(TEXT_DE.shared.pwa.update.confirmMessage)) {
      updateSW(true)
    }
  }
})
