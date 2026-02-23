// Vitest setup file for @flashcards/shared package

import { vi } from 'vitest'

import { LocalStorageMock } from '../test-utils.js'

// Suppress Vue lifecycle warnings from composables called outside component context
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    msg.includes('Failed to resolve component') ||
    msg.includes('onUnmounted is called when there is no active component instance')
  )
    return
  originalWarn(...args)
}

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
