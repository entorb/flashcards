import { describe, it, expect } from 'vitest'

import { calculateTimePerTask, calculateTotalRuntime } from './measurementCalculations'
import type { MeasurementPoint, SessionData } from '@/types'

describe('calculateTimePerTask', () => {
  it('should return null for invalid index', () => {
    const measurements: MeasurementPoint[] = []
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateTimePerTask(measurements, startTime, 0)

    expect(result).toBeNull()
  })

  it('should calculate time per task for first measurement', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 5 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateTimePerTask(measurements, startTime, 0)

    expect(result).toBe(60) // 5 minutes = 300 seconds / 5 tasks = 60 seconds per task
  })

  it('should return null for first measurement with zero completed tasks', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 0 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateTimePerTask(measurements, startTime, 0)

    expect(result).toBeNull()
  })

  it('should calculate time per task for subsequent measurements', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 5 },
      { timestamp: new Date('2024-01-01T10:10:00'), completedTasks: 10 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateTimePerTask(measurements, startTime, 1)

    expect(result).toBe(60) // 5 minutes = 300 seconds / 5 tasks = 60 seconds per task
  })

  it('should return null for zero task difference', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 5 },
      { timestamp: new Date('2024-01-01T10:10:00'), completedTasks: 5 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateTimePerTask(measurements, startTime, 1)

    expect(result).toBeNull()
  })
})

describe('calculateTotalRuntime', () => {
  it('should return null for empty measurements', () => {
    const sessionData: SessionData = {
      totalTasks: 10,
      startTime: new Date('2024-01-01T10:00:00'),
      measurements: []
    }

    const result = calculateTotalRuntime(sessionData)

    expect(result).toBeNull()
  })

  it('should calculate total runtime correctly', () => {
    const sessionData: SessionData = {
      totalTasks: 10,
      startTime: new Date('2024-01-01T10:00:00'),
      measurements: [
        { timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 5 },
        { timestamp: new Date('2024-01-01T10:10:00'), completedTasks: 10 }
      ]
    }

    const result = calculateTotalRuntime(sessionData)

    expect(result).toBe(600) // 10 minutes = 600 seconds
  })
})
