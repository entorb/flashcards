import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-voc',
  appTitle: "Rabat's Wortspiel",
  description: 'Rechtschreibung üben mit Rabat dem Fuchs und seinem Lernkastensystem',
  themeColor: '#1976d2',
  serverPort: 5174,
  previewPort: 4174,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
