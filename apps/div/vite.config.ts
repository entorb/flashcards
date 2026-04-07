import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-div',
  appTitle: "Diva's Divisions-Spiel",
  description: 'Division üben mit Diva dem Huhn und ihrem Lernkastensystem',
  themeColor: '#DAA520',
  serverPort: 5177,
  previewPort: 4177,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
