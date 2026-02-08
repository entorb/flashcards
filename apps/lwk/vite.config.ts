import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-lwk',
  appTitle: "Eisi's Lernwörter",
  description: 'Rechtschreibung üben mit Eisi dem Eisbären und seinem Lernkastensystem',
  themeColor: '#00bcd4',
  serverPort: 5175,
  previewPort: 4175,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
