import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-voc',
  appTitle: "Rabat's Wortspiel",
  description: 'Vokabeln üben mit Rabat dem Fuchs und seinem Lernkastensystem',
  themeColor: '#f97316',
  serverPort: 5174,
  previewPort: 4174,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
