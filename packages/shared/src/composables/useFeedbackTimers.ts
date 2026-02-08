import { onUnmounted, ref } from 'vue'

import { AUTO_CLOSE_DURATION } from '../constants'

/**
 * Shared composable for managing feedback timers in flashcard games
 *
 * Handles:
 * - Auto-advance timer for correct answers (3 seconds)
 * - Countdown display for auto-close timer
 * - Automatic cleanup on component unmount
 *
 * Note: Button component manages its own visual countdown and disabled state independently.
 * Parent pages track button disabled state via event listeners for keyboard control.
 *
 * @param options Configuration options
 * @returns Timer state and control functions
 */
export function useFeedbackTimers(options?: {
  autoCloseDuration?: number
  countdownInterval?: number
}) {
  const autoCloseDuration = options?.autoCloseDuration ?? AUTO_CLOSE_DURATION
  const countdownInterval = options?.countdownInterval ?? 1000

  // State
  const autoCloseCountdown = ref(0)

  // Timer references
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
  let autoCloseCountdownInterval: ReturnType<typeof setInterval> | null = null

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

  // Cleanup on component unmount
  onUnmounted(() => {
    clearAutoCloseTimers()
  })

  return {
    // State
    autoCloseCountdown,

    // Control functions
    startAutoCloseTimer,
    clearAutoCloseTimers
  }
}
