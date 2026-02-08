import { STORAGE_KEYS } from '@/constants'
import type { SessionData } from '@/types'

/**
 * Load session data from localStorage
 * @returns SessionData or null if not found or invalid
 */
export function loadSession(): SessionData | null {
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEYS.SESSION)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored)

    // Validate the session data
    if (!parsed.totalTasks || parsed.totalTasks <= 0 || !Number.isInteger(parsed.totalTasks)) {
      // Invalid session, clear it
      clearSession()
      return null
    }

    return {
      totalTasks: parsed.totalTasks,
      startTime: new Date(parsed.startTime),
      measurements: parsed.measurements.map((m: { timestamp: string; completedTasks: number }) => ({
        timestamp: new Date(m.timestamp),
        completedTasks: m.completedTasks
      }))
    }
  } catch {
    // If there's any error parsing, clear the corrupted data
    clearSession()
    return null
  }
}

/**
 * Save session data to localStorage
 * Handles date serialization to ISO strings
 */
export function saveSession(session: SessionData): void {
  try {
    const toStore = {
      totalTasks: session.totalTasks,
      startTime: session.startTime.toISOString(),
      measurements: session.measurements.map(m => ({
        timestamp: m.timestamp.toISOString(),
        completedTasks: m.completedTasks
      }))
    }
    globalThis.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(toStore))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

/**
 * Clear session data from localStorage
 */
export function clearSession(): void {
  try {
    globalThis.localStorage.removeItem(STORAGE_KEYS.SESSION)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Check if an active session exists in localStorage
 */
export function hasActiveSession(): boolean {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEYS.SESSION) !== null
  } catch (error) {
    console.error('Failed to check active session:', error)
    return false
  }
}
