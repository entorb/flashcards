// Vitest setup file

import { LocalStorageMock } from '@flashcards/shared'
import { vi } from 'vitest'

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
