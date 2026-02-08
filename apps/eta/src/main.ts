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

app.mount('#app')

// Register PWA service worker after app is mounted
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    Dialog.create({
      message: TEXT_DE.shared.pwa.update.confirmMessage,
      cancel: true,
      persistent: true
    }).onOk(() => {
      updateSW(true)
    })
  }
})
