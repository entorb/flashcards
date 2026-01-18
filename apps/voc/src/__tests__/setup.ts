import { vi } from 'vitest'

// Suppress Vue warnings about unresolved Quasar components
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Failed to resolve component')) return
  originalWarn(...args)
}

// Setup global test environment for jsdom
globalThis.CSS = { supports: () => false } as any

globalThis.matchMedia =
  globalThis.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))

// Create in-memory storage implementation for localStorage and sessionStorage
class LocalStorageMock implements Storage {
  private readonly store: Map<string, string> = new Map()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

globalThis.localStorage = new LocalStorageMock()
globalThis.sessionStorage = new LocalStorageMock()
