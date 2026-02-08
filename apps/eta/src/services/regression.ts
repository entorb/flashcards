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

  const sumX = X.reduce((a, b) => a + b, 0)
  const sumY = Y.reduce((a, b) => a + b, 0)
  const avgX = sumX / n
  const avgY = sumY / n

  const numerator = X.map((x, i) => (x - avgX) * ((Y[i] ?? 0) - avgY)).reduce(
    (prev, curr) => prev + curr,
    0
  )
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
    if (X[0] === undefined || X[1] === undefined || Y[0] === undefined || Y[1] === undefined) {
      return null
    }
    const dX = X[1] - X[0]
    const dY = Y[1] - Y[0]
    if (dX === 0) {
      return null
    }
    return { slope: dY / dX, intercept: Y[0] - (dY / dX) * X[0] }
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
