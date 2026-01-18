// Vitest setup file

import { LocalStorageMock } from '@flashcards/shared'

globalThis.localStorage = new LocalStorageMock()
globalThis.sessionStorage = new LocalStorageMock()
