import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-eta',
  appTitle: 'Hausi-Rest-Zeit-Schätzer',
  description: 'Schätze die Restzeit für deine Hausaufgaben',
  themeColor: '#8B4513',
  serverPort: 5176,
  previewPort: 4176,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
