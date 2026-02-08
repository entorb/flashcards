export interface MeasurementPoint {
  timestamp: Date
  completedTasks: number
}

export interface SessionData {
  totalTasks: number
  startTime: Date
  measurements: MeasurementPoint[]
}

export interface RegressionResult {
  slope: number
  intercept: number
}

export interface TimeEstimate {
  remainingSeconds: number
  completionTime: Date
}
