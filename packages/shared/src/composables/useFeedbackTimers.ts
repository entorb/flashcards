import { onUnmounted, ref } from 'vue'

import { AUTO_CLOSE_DURATION, BUTTON_DISABLE_DURATION } from '../constants'

/**
 * Shared composable for managing feedback timers in flashcard games
 *
 * Handles:
 * - Auto-advance timer for correct answers (3 seconds)
 * - Button disable timer for incorrect answers (3 seconds)
 * - Countdown displays for both timers
 * - Automatic cleanup on component unmount
 *
 * @param options Configuration options
 * @returns Timer state and control functions
 */
export function useFeedbackTimers(options?: {
  autoCloseDuration?: number
  buttonDisableDuration?: number
  countdownInterval?: number
}) {
  const autoCloseDuration = options?.autoCloseDuration ?? AUTO_CLOSE_DURATION
  const buttonDisableDuration = options?.buttonDisableDuration ?? BUTTON_DISABLE_DURATION
  const countdownInterval = options?.countdownInterval ?? 1000

  // State
  const isButtonDisabled = ref(false)
  const isEnterDisabled = ref(false)
  const buttonDisableCountdown = ref(0)
  const autoCloseCountdown = ref(0)

  // Timer references
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
  let autoCloseCountdownInterval: ReturnType<typeof setInterval> | null = null
  let buttonDisableTimer: ReturnType<typeof setTimeout> | null = null
  let buttonDisableCountdownInterval: ReturnType<typeof setInterval> | null = null
  let enterDisableTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Start auto-close timer for correct answers
   * Calls the callback after the specified duration
   */
  function startAutoCloseTimer(callback: () => void) {
    clearAutoCloseTimers()
    autoCloseCountdown.value = autoCloseDuration / 1000

    // Update countdown display
    autoCloseCountdownInterval = setInterval(() => {
      autoCloseCountdown.value--
      if (autoCloseCountdown.value <= 0 && autoCloseCountdownInterval) {
        clearInterval(autoCloseCountdownInterval)
      }
    }, countdownInterval)

    // Auto-close after the specified time
    autoCloseTimer = setTimeout(() => {
      callback()
    }, autoCloseDuration)
  }

  /**
   * Start button disable timer for incorrect answers
   * Disables both button and Enter key for the specified duration
   */
  function startButtonDisableTimer(callback?: () => void) {
    isButtonDisabled.value = true
    isEnterDisabled.value = true
    buttonDisableCountdown.value = buttonDisableDuration / 1000

    // Update countdown display
    buttonDisableCountdownInterval = setInterval(() => {
      buttonDisableCountdown.value--
      if (buttonDisableCountdown.value <= 0 && buttonDisableCountdownInterval) {
        clearInterval(buttonDisableCountdownInterval)
      }
    }, countdownInterval)

    // Re-enable button after the specified time
    buttonDisableTimer = setTimeout(() => {
      isButtonDisabled.value = false
      buttonDisableCountdown.value = 0
      if (callback) callback()
    }, buttonDisableDuration)

    // Re-enable Enter key after the specified time
    enterDisableTimer = setTimeout(() => {
      isEnterDisabled.value = false
    }, buttonDisableDuration)
  }

  /**
   * Clear auto-close timers
   */
  function clearAutoCloseTimers() {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
      autoCloseTimer = null
    }
    if (autoCloseCountdownInterval) {
      clearInterval(autoCloseCountdownInterval)
      autoCloseCountdownInterval = null
    }
    autoCloseCountdown.value = 0
  }

  /**
   * Clear button disable timers
   */
  function clearButtonDisableTimers() {
    if (buttonDisableTimer) {
      clearTimeout(buttonDisableTimer)
      buttonDisableTimer = null
    }
    if (buttonDisableCountdownInterval) {
      clearInterval(buttonDisableCountdownInterval)
      buttonDisableCountdownInterval = null
    }
    if (enterDisableTimer) {
      clearTimeout(enterDisableTimer)
      enterDisableTimer = null
    }
    isButtonDisabled.value = false
    isEnterDisabled.value = false
    buttonDisableCountdown.value = 0
  }

  /**
   * Clear all timers
   */
  function clearAllTimers() {
    clearAutoCloseTimers()
    clearButtonDisableTimers()
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    clearAllTimers()
  })

  return {
    // State
    isButtonDisabled,
    isEnterDisabled,
    buttonDisableCountdown,
    autoCloseCountdown,

    // Control functions
    startAutoCloseTimer,
    startButtonDisableTimer,
    clearAutoCloseTimers,
    clearButtonDisableTimers,
    clearAllTimers
  }
}
