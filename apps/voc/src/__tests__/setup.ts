import { vi } from 'vitest'
import { LocalStorageMock } from '@flashcards/shared'

// Suppress Vue warnings about unresolved Quasar components
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Failed to resolve component')) return
  originalWarn(...args)
}

// Setup global test environment for jsdom
globalThis.CSS = { supports: () => false } as any

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

globalThis.localStorage = new LocalStorageMock()
globalThis.sessionStorage = new LocalStorageMock()
