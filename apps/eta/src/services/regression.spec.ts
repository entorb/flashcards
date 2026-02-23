import { describe, it, expect } from 'vitest'

import {
  calculateLinearRegression,
  calculateRegression,
  convertToXY,
  predictRemainingTime
} from './regression'
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

describe('convertToXY', () => {
  it('converts measurement points to seconds and tasks arrays', () => {
    const startTime = new Date('2024-01-01T10:00:00')
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 5 },
      { timestamp: new Date('2024-01-01T10:02:00'), completedTasks: 10 }
    ]
    const { seconds, tasks } = convertToXY(measurements, startTime)
    expect(seconds).toEqual([60, 120])
    expect(tasks).toEqual([5, 10])
  })

  it('returns zero seconds for measurement at session start', () => {
    const startTime = new Date('2024-01-01T10:00:00')
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:00:00'), completedTasks: 3 }
    ]
    const { seconds, tasks } = convertToXY(measurements, startTime)
    expect(seconds).toEqual([0])
    expect(tasks).toEqual([3])
  })

  it('returns empty arrays for empty measurements', () => {
    const startTime = new Date('2024-01-01T10:00:00')
    const { seconds, tasks } = convertToXY([], startTime)
    expect(seconds).toEqual([])
    expect(tasks).toEqual([])
  })
})

describe('calculateLinearRegression', () => {
  it('returns null for empty arrays', () => {
    expect(calculateLinearRegression([], [])).toBeNull()
  })

  it('returns null when all X values are identical (zero denominator)', () => {
    expect(calculateLinearRegression([5, 5, 5], [1, 2, 3])).toBeNull()
  })

  it('calculates correct slope and intercept for simple linear data', () => {
    // y = 2x + 1 → slope=2, intercept=1
    const X = [0, 1, 2, 3, 4]
    const Y = [1, 3, 5, 7, 9]
    const result = calculateLinearRegression(X, Y)
    expect(result).not.toBeNull()
    expect(result?.slope).toBeCloseTo(2, 5)
    expect(result?.intercept).toBeCloseTo(1, 5)
  })

  it('handles single data point', () => {
    // n=1: sumX=avgX, denominator=0 → null
    expect(calculateLinearRegression([5], [10])).toBeNull()
  })
})

describe('calculateRegression with n >= 3 measurements', () => {
  it('uses linear regression for 3+ measurements', () => {
    const startTime = new Date('2024-01-01T10:00:00')
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 2 },
      { timestamp: new Date('2024-01-01T10:02:00'), completedTasks: 4 },
      { timestamp: new Date('2024-01-01T10:03:00'), completedTasks: 6 }
    ]
    const result = calculateRegression(measurements, startTime)
    expect(result).not.toBeNull()
    expect(result?.slope).toBeGreaterThan(0)
  })

  it('returns null for 0 measurements', () => {
    expect(calculateRegression([], new Date())).toBeNull()
  })

  it('returns null when all timestamps are identical for n>=3', () => {
    const startTime = new Date('2024-01-01T10:00:00')
    const measurements: MeasurementPoint[] = [
      { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 2 },
      { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 4 },
      { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 6 }
    ]
    const result = calculateRegression(measurements, startTime)
    expect(result).toBeNull()
  })
})

describe('predictRemainingTime with negative slope', () => {
  it('returns null for negative slope', () => {
    const result = predictRemainingTime({ slope: -1, intercept: 10 }, 20, 5)
    expect(result).toBeNull()
  })
})
