import { ref, computed } from 'vue'

import { calculateRegression, predictRemainingTime } from '@/services/regression'
import { loadSession, saveSession, clearSession } from '@/services/storage'
import type { SessionData, MeasurementPoint, TimeEstimate } from '@/types'

const sessionData = ref<SessionData | null>(null)

export function useEtaStore() {
  const isSessionActive = computed(() => sessionData.value !== null)

  const currentCompleted = computed(() => {
    const measurements = sessionData.value?.measurements
    if (!measurements || measurements.length === 0) {
      return 0
    }
    // Array is non-empty, so last element is always defined
    const last = measurements[measurements.length - 1]
    return last ? last.completedTasks : 0
  })

  const progressPercentage = computed(() => {
    if (!sessionData.value) {
      return 0
    }
    return (currentCompleted.value / sessionData.value.totalTasks) * 100
  })

  function initialize(): void {
    const loaded = loadSession()
    if (loaded) {
      sessionData.value = loaded
    }
  }

  function startSession(totalTasks: number): void {
    if (totalTasks <= 0 || !Number.isInteger(totalTasks)) {
      return
    }

    sessionData.value = {
      totalTasks,
      startTime: new Date(),
      measurements: []
    }
    saveSession(sessionData.value)
  }

  function addMeasurement(completedTasks: number): boolean {
    if (!sessionData.value) {
      return false
    }

    if (completedTasks < 0 || completedTasks > sessionData.value.totalTasks) {
      return false
    }

    if (completedTasks <= currentCompleted.value) {
      return false
    }

    const newTimestamp = new Date()

    // Silently ignore if same timestamp as last measurement
    const lastMeasurement =
      sessionData.value.measurements[sessionData.value.measurements.length - 1]
    if (lastMeasurement?.timestamp.getTime() === newTimestamp.getTime()) {
      return false
    }

    const measurement: MeasurementPoint = {
      timestamp: newTimestamp,
      completedTasks
    }

    sessionData.value.measurements.push(measurement)
    saveSession(sessionData.value)
    return true
  }

  function deleteMeasurement(index: number): void {
    if (!sessionData.value) {
      return
    }

    if (index < 0 || index >= sessionData.value.measurements.length) {
      return
    }

    sessionData.value.measurements.splice(index, 1)
    saveSession(sessionData.value)
  }

  function resetSession(): void {
    sessionData.value = null
    clearSession()
  }

  function getTimeEstimates(): TimeEstimate | null {
    if (!sessionData.value || sessionData.value.measurements.length < 2) {
      return null
    }

    const regression = calculateRegression(
      sessionData.value.measurements,
      sessionData.value.startTime
    )

    if (!regression) {
      return null
    }

    const currentElapsedSeconds = (Date.now() - sessionData.value.startTime.getTime()) / 1000

    return predictRemainingTime(regression, sessionData.value.totalTasks, currentElapsedSeconds)
  }

  function isComplete(): boolean {
    if (!sessionData.value) {
      return false
    }
    return currentCompleted.value >= sessionData.value.totalTasks
  }

  return {
    sessionData: computed(() => sessionData.value),
    isSessionActive,
    currentCompleted,
    progressPercentage,
    initialize,
    startSession,
    addMeasurement,
    deleteMeasurement,
    resetSession,
    getTimeEstimates,
    isComplete
  }
}
