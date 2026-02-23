import type { MeasurementPoint, RegressionResult, TimeEstimate } from '@/types'

/**
 * Convert measurement points to X (seconds) and Y (tasks) arrays for regression
 */
export function convertToXY(
  measurements: MeasurementPoint[],
  sessionStartTime: Date
): { seconds: number[]; tasks: number[] } {
  const tasks = measurements.map(point => point.completedTasks)
  const timestampsMs = measurements.map(point => point.timestamp.getTime())
  const firstTimestamp = sessionStartTime.getTime()

  const seconds = timestampsMs.map(timestamp => (timestamp - firstTimestamp) / 1000)
  return { seconds, tasks }
}

/**
 * Calculate linear regression using least squares method
 * @returns RegressionResult or null if all X values are identical (division by zero)
 */
export function calculateLinearRegression(X: number[], Y: number[]): RegressionResult | null {
  const n = X.length
  if (n === 0) {
    return null
  }

  const sumX = X.reduce((a, b) => a + b, 0)
  const sumY = Y.reduce((a, b) => a + b, 0)
  const avgX = sumX / n
  const avgY = sumY / n

  const numerator = X.reduce((sum, x, i) => sum + (x - avgX) * ((Y[i] ?? 0) - avgY), 0)
  const denominator = X.map(x => (x - avgX) ** 2).reduce((prev, curr) => prev + curr, 0)

  if (denominator === 0) {
    return null
  }

  const slope = numerator / denominator
  const intercept = avgY - slope * avgX
  return { slope, intercept }
}

/**
 * Calculate regression from measurement points
 * @returns RegressionResult or null if insufficient data or invalid
 */
export function calculateRegression(
  measurements: MeasurementPoint[],
  sessionStartTime: Date
): RegressionResult | null {
  const n = measurements.length
  if (n <= 1) {
    return null
  }

  const { seconds: X, tasks: Y } = convertToXY(measurements, sessionStartTime)

  if (n === 2) {
    // X and Y are guaranteed to have exactly 2 elements (mapped 1:1 from measurements)
    const [x0, x1] = X as [number, number]
    const [y0, y1] = Y as [number, number]
    const dX = x1 - x0
    const dY = y1 - y0
    if (dX === 0) {
      return null
    }
    return { slope: dY / dX, intercept: y0 - (dY / dX) * x0 }
  }

  // For n >= 3, use linear regression (returns null if all X values are identical)
  return calculateLinearRegression(X, Y)
}

/**
 * Predict remaining time and completion time based on regression
 * @returns TimeEstimate or null if regression slope is invalid
 */
export function predictRemainingTime(
  regression: RegressionResult,
  totalTasks: number,
  currentElapsedSeconds: number
): TimeEstimate | null {
  if (regression.slope <= 0) {
    return null
  }

  const secondsToComplete = (totalTasks - regression.intercept) / regression.slope
  const remainingSeconds = Math.max(0, secondsToComplete - currentElapsedSeconds)

  const completionTime = new Date(Date.now() + remainingSeconds * 1000)

  return {
    remainingSeconds,
    completionTime
  }
}
