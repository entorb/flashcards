// Vitest setup file

import { vi } from 'vitest'
import { LocalStorageMock } from '@flashcards/shared'

globalThis.localStorage = new LocalStorageMock()
globalThis.sessionStorage = new LocalStorageMock()

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
