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
 */
export function calculateLinearRegression(X: number[], Y: number[]): RegressionResult {
  const n = X.length

  let sumX = 0
  let sumY = 0
  for (const [index, xVal] of X.entries()) {
    const yVal = Y[index]
    if (xVal !== undefined && yVal !== undefined) {
      sumX += xVal
      sumY += yVal
    }
  }
  const avgX = sumX / n
  const avgY = sumY / n

  const xDifferencesToAverage = X.map(value => avgX - value)
  const yDifferencesToAverage = Y.map(value => avgY - value)
  const xDifferencesToAverageSquared = xDifferencesToAverage.map(value => value ** 2)
  const xAndYDifferencesMultiplied = xDifferencesToAverage.map(
    (curr, index) => curr * (yDifferencesToAverage[index] ?? 0)
  )
  const denominator = xDifferencesToAverageSquared.reduce((prev, curr) => prev + curr, 0)
  const numerator = xAndYDifferencesMultiplied.reduce((prev, curr) => prev + curr, 0)

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
