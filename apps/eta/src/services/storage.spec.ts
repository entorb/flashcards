import { describe, it, expect, beforeEach, vi } from 'vitest'

import { STORAGE_KEYS } from '@/constants'
import type { SessionData } from '@/types'

import { loadSession, saveSession, clearSession, hasActiveSession } from './storage'

describe('storage service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    globalThis.localStorage.clear()
  })

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const session: SessionData = {
        totalTasks: 10,
        startTime: new Date('2024-01-01T10:00:00Z'),
        measurements: [
          { timestamp: new Date('2024-01-01T10:00:00Z'), completedTasks: 0 },
          { timestamp: new Date('2024-01-01T10:05:00Z'), completedTasks: 5 }
        ]
      }

      saveSession(session)

      const stored = globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)
      expect(stored).not.toBeNull()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.totalTasks).toBe(10)
        expect(parsed.startTime).toBe('2024-01-01T10:00:00.000Z')
        expect(parsed.measurements).toHaveLength(2)
        expect(parsed.measurements[0].timestamp).toBe('2024-01-01T10:00:00.000Z')
        expect(parsed.measurements[1].timestamp).toBe('2024-01-01T10:05:00.000Z')
      }
    })

    it('should handle save errors gracefully', () => {
      const session: SessionData = {
        totalTasks: 10,
        startTime: new Date('2024-01-01T10:00:00'),
        measurements: []
      }

      // Mock localStorage.setItem to throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(globalThis.localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Quota exceeded')
      })

      saveSession(session)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save session:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe('loadSession', () => {
    it('should load session from localStorage', () => {
      const sessionData = {
        totalTasks: 10,
        startTime: '2024-01-01T10:00:00.000Z',
        measurements: [
          { timestamp: '2024-01-01T10:00:00.000Z', completedTasks: 0 },
          { timestamp: '2024-01-01T10:05:00.000Z', completedTasks: 5 }
        ]
      }

      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData))

      const loaded = loadSession()

      expect(loaded).not.toBeNull()
      expect(loaded?.totalTasks).toBe(10)
      expect(loaded?.startTime).toBeInstanceOf(Date)
      expect(loaded?.measurements).toHaveLength(2)
      expect(loaded?.measurements[0]?.timestamp).toBeInstanceOf(Date)
    })

    it('should return null when no session exists', () => {
      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    it('should return null and clear corrupted data', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, 'invalid json')

      const loaded = loadSession()

      expect(loaded).toBeNull()
      expect(globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull()
    })

    it('should validate and clear invalid session data', () => {
      const invalidSession = {
        totalTasks: -5, // Invalid: negative
        startTime: '2024-01-01T10:00:00.000Z',
        measurements: []
      }

      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(invalidSession))

      const loaded = loadSession()

      expect(loaded).toBeNull()
      expect(globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull()
    })

    it('should validate and clear session with non-integer totalTasks', () => {
      const invalidSession = {
        totalTasks: 10.5, // Invalid: not an integer
        startTime: '2024-01-01T10:00:00.000Z',
        measurements: []
      }

      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(invalidSession))

      const loaded = loadSession()

      expect(loaded).toBeNull()
      expect(globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      const sessionData = {
        totalTasks: 10,
        startTime: '2024-01-01T10:00:00.000Z',
        measurements: []
      }

      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData))

      clearSession()

      expect(globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull()
    })

    it('should handle clear errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(globalThis.localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      clearSession()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear session:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe('hasActiveSession', () => {
    it('should return true when session exists', () => {
      const sessionData = {
        totalTasks: 10,
        startTime: '2024-01-01T10:00:00.000Z',
        measurements: []
      }

      globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData))

      expect(hasActiveSession()).toBe(true)
    })

    it('should return false when no session exists', () => {
      expect(hasActiveSession()).toBe(false)
    })
  })
})
