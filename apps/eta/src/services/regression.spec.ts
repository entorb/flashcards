import { describe, it, expect } from 'vitest'

import { calculateRegression, predictRemainingTime } from './regression'
import type { MeasurementPoint } from '@/types'

describe('calculateRegression', () => {
  it('should return null for less than 2 measurements', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:00:00'), completedTasks: 5 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateRegression(measurements, startTime)

    expect(result).toBeNull()
  })

  it('should calculate regression for valid measurements', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:00:00'), completedTasks: 5 },
      { timestamp: new Date('2024-01-01T10:10:00'), completedTasks: 10 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateRegression(measurements, startTime)

    expect(result).not.toBeNull()
    expect(result?.slope).toBeGreaterThan(0)
    expect(result?.intercept).toBeDefined()
  })

  it('should handle measurements with same elapsed time', () => {
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:00:00'), completedTasks: 5 },
      { timestamp: new Date('2024-01-01T10:00:00'), completedTasks: 10 }
    ]
    const startTime = new Date('2024-01-01T10:00:00')

    const result = calculateRegression(measurements, startTime)

    expect(result).toBeNull()
  })
})

describe('predictRemainingTime', () => {
  it('should predict remaining time correctly', () => {
    const regression = { slope: 0.5, intercept: 0 }
    const totalTasks = 20
    const currentElapsedSeconds = 10

    const result = predictRemainingTime(regression, totalTasks, currentElapsedSeconds)

    expect(result).not.toBeNull()
    expect(result?.remainingSeconds).toBeGreaterThan(0)
    expect(result?.completionTime).toBeInstanceOf(Date)
  })

  it('should return null for zero or negative slope', () => {
    const regression = { slope: 0, intercept: 0 }
    const totalTasks = 20
    const currentElapsedSeconds = 10

    const result = predictRemainingTime(regression, totalTasks, currentElapsedSeconds)

    expect(result).toBeNull()
  })

  it('should handle negative remaining time', () => {
    const regression = { slope: 0.5, intercept: 0 }
    const totalTasks = 5
    const currentElapsedSeconds = 100

    const result = predictRemainingTime(regression, totalTasks, currentElapsedSeconds)

    expect(result).not.toBeNull()
    expect(result?.remainingSeconds).toBe(0)
  })
})
