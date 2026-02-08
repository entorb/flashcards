import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useEtaStore } from './useEtaStore'
import type { SessionData } from '@/types'

// Mock the services
vi.mock('@/services/regression', () => ({
  calculateRegression: vi.fn(),
  predictRemainingTime: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  loadSession: vi.fn(),
  saveSession: vi.fn(),
  clearSession: vi.fn()
}))

import { calculateRegression, predictRemainingTime } from '@/services/regression'
import { loadSession, saveSession, clearSession } from '@/services/storage'

describe('useEtaStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with no session', () => {
      const store = useEtaStore()

      expect(store.isSessionActive.value).toBe(false)
      expect(store.sessionData.value).toBeNull()
      expect(store.currentCompleted.value).toBe(0)
      expect(store.progressPercentage.value).toBe(0)
    })

    it('should load session on initialize', () => {
      const mockSession: SessionData = {
        totalTasks: 10,
        startTime: new Date('2024-01-01T10:00:00'),
        measurements: [{ timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 5 }]
      }
      vi.mocked(loadSession).mockReturnValue(mockSession)

      const store = useEtaStore()
      store.initialize()

      expect(loadSession).toHaveBeenCalled()
      expect(store.sessionData.value).toEqual(mockSession)
      expect(store.isSessionActive.value).toBe(true)
      expect(store.currentCompleted.value).toBe(5)
      expect(store.progressPercentage.value).toBe(50)
    })
  })

  describe('startSession', () => {
    it('should not start session with invalid totalTasks', () => {
      const store = useEtaStore()
      store.resetSession()

      store.startSession(0)
      expect(store.isSessionActive.value).toBe(false)

      store.startSession(-1)
      expect(store.isSessionActive.value).toBe(false)

      store.startSession(1.5)
      expect(store.isSessionActive.value).toBe(false)
    })

    it('should start session with valid totalTasks', () => {
      const store = useEtaStore()

      store.startSession(10)

      expect(store.isSessionActive.value).toBe(true)
      expect(store.sessionData.value?.totalTasks).toBe(10)
      expect(store.sessionData.value?.measurements).toEqual([])
      expect(saveSession).toHaveBeenCalledWith(store.sessionData.value)
    })
  })

  describe('addMeasurement', () => {
    it('should not add measurement without active session', () => {
      const store = useEtaStore()
      store.resetSession()

      const result = store.addMeasurement(5)

      expect(result).toBe(false)
      expect(saveSession).not.toHaveBeenCalled()
    })

    it('should not add invalid completedTasks', () => {
      const store = useEtaStore()
      store.startSession(10)

      expect(store.addMeasurement(-1)).toBe(false)
      expect(store.addMeasurement(15)).toBe(false)
      expect(saveSession).toHaveBeenCalledTimes(1) // only from startSession
    })

    it('should not add measurement if not greater than current', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(5)

      const result = store.addMeasurement(3)

      expect(result).toBe(false)
    })

    it('should add valid measurement', () => {
      const store = useEtaStore()
      store.startSession(10)

      const result = store.addMeasurement(5)

      expect(result).toBe(true)
      expect(store.sessionData.value?.measurements).toHaveLength(1)
      expect(store.sessionData.value?.measurements[0]?.completedTasks).toBe(5)
      expect(saveSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteMeasurement', () => {
    it('should not delete without active session', () => {
      const store = useEtaStore()

      store.deleteMeasurement(0)

      expect(clearSession).not.toHaveBeenCalled()
    })

    it('should not delete invalid index', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(5)

      store.deleteMeasurement(-1)
      store.deleteMeasurement(5)

      expect(store.sessionData.value?.measurements).toHaveLength(1)
    })

    it('should delete valid measurement', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(5)

      store.deleteMeasurement(0)

      expect(store.sessionData.value?.measurements).toHaveLength(0)
      expect(saveSession).toHaveBeenCalledTimes(3) // start + add + delete
    })
  })

  describe('resetSession', () => {
    it('should reset session', () => {
      const store = useEtaStore()
      store.startSession(10)

      store.resetSession()

      expect(store.isSessionActive.value).toBe(false)
      expect(store.sessionData.value).toBeNull()
      expect(clearSession).toHaveBeenCalled()
    })
  })

  describe('getTimeEstimates', () => {
    it('should return null without session', () => {
      const store = useEtaStore()

      const result = store.getTimeEstimates()

      expect(result).toBeNull()
    })

    it('should return null with insufficient measurements', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(5)

      const result = store.getTimeEstimates()

      expect(result).toBeNull()
    })

    it('should return estimates with valid data', () => {
      vi.mocked(calculateRegression).mockReturnValue({ slope: 0.1, intercept: 0 })
      vi.mocked(predictRemainingTime).mockReturnValue({
        remainingSeconds: 500,
        completionTime: new Date('2024-01-01T10:10:00')
      })

      const store = useEtaStore()
      vi.useFakeTimers()
      store.startSession(10)
      store.addMeasurement(5)
      vi.advanceTimersByTime(1000)
      store.addMeasurement(8)
      vi.useRealTimers()

      const result = store.getTimeEstimates()

      expect(calculateRegression).toHaveBeenCalled()
      expect(predictRemainingTime).toHaveBeenCalled()
      expect(result).not.toBeNull()
      expect(result?.remainingSeconds).toBe(500)
    })
  })

  describe('isComplete', () => {
    it('should return false without session', () => {
      const store = useEtaStore()

      expect(store.isComplete()).toBe(false)
    })

    it('should return false when not complete', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(5)

      expect(store.isComplete()).toBe(false)
    })

    it('should return true when complete', () => {
      const store = useEtaStore()
      store.startSession(10)
      store.addMeasurement(10)

      expect(store.isComplete()).toBe(true)
    })
  })
})
