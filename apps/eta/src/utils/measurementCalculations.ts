/**
 * Measurement calculation utilities
 */

import type { MeasurementPoint, SessionData } from '@/types'

/**
 * Calculate time per task for a specific measurement
 * @param measurements - Array of all measurements
 * @param sessionStartTime - Session start time
 * @param index - Index of the measurement to calculate for
 * @returns Time per task in seconds, or null if cannot be calculated
 */
export function calculateTimePerTask(
  measurements: MeasurementPoint[],
  sessionStartTime: Date,
  index: number
): number | null {
  const current = measurements[index]
  if (!current) {
    return null
  }

  // First measurement: calculate from session start
  if (index === 0) {
    const timeDiffMs = current.timestamp.getTime() - sessionStartTime.getTime()
    const timeDiffSeconds = timeDiffMs / 1000
    if (current.completedTasks === 0) {
      return null
    }
    return Math.round(timeDiffSeconds / current.completedTasks)
  }

  // Subsequent measurements: calculate from previous measurement
  const previous = measurements[index - 1]
  if (!previous) {
    return null
  }

  const timeDiffMs = current.timestamp.getTime() - previous.timestamp.getTime()
  const taskDiff = current.completedTasks - previous.completedTasks

  if (taskDiff === 0) {
    return null
  }

  const timeDiffSeconds = timeDiffMs / 1000
  return Math.round(timeDiffSeconds / taskDiff)
}

/**
 * Calculate total runtime from session start to last measurement
 */
export function calculateTotalRuntime(sessionData: SessionData): number | null {
  if (!sessionData.measurements.length) {
    return null
  }

  const lastMeasurement = sessionData.measurements[sessionData.measurements.length - 1]
  if (!lastMeasurement) {
    return null
  }

  return Math.floor((lastMeasurement.timestamp.getTime() - sessionData.startTime.getTime()) / 1000)
}
