import { fileURLToPath } from 'node:url'

import { createAppViteConfig } from '../../vite.config.factory'

export default createAppViteConfig({
  basePath: 'fc-1x1',
  appTitle: "Vyvit's 1x1",
  description: '1x1 üben mit Vyvit dem Murmeltier und seinem Lernkastensystem',
  themeColor: '#8B6F47',
  serverPort: 5173,
  previewPort: 4173,
  srcDir: fileURLToPath(new URL('./src', import.meta.url))
})
