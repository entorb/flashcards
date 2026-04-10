import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-pum',
  appTitle: "Plumi's Plus & Minus",
  description: 'Plus und Minus üben mit Plumi dem Waschbären und seinem Lernkastensystem',
  themeColor: '#607D8B',
  serverPort: 5178,
  previewPort: 4178,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
