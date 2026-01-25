/**
 * Shared Game Navigation Composable
 * Provides common navigation logic used across all game pages
 */

import type { Router } from 'vue-router'

export interface UseGameNavigationOptions {
  /** Timer stop function from useGameTimer */
  stopTimer: () => void
  /** Next card function from game store */
  nextCard: () => boolean
  /** Finish game function from game store */
  finishGame: () => void
  /** Discard game function from game store */
  discardGame: () => void
  /** Vue router instance */
  router: Router
}

/**
 * Create game navigation functions with consistent behavior across apps
 *
 * @param options Configuration object with required dependencies
 * @returns Navigation functions for game pages
 *
 * @example
 * ```typescript
 * const { handleNextCard, handleGoHome } = useGameNavigation({
 *   stopTimer,
 *   nextCard,
 *   finishGame,
 *   discardGame,
 *   router
 * })
 * ```
 */
export function useGameNavigation(options: UseGameNavigationOptions) {
  const { stopTimer, nextCard, finishGame, discardGame, router } = options

  /**
   * Handle proceeding to the next card or finishing the game
   * Called when user clicks next/proceed button or presses Enter
   */
  function handleNextCard() {
    const isGameOver = nextCard()
    if (isGameOver) {
      stopTimer()
      finishGame()
      router.push({ name: '/game-over' })
    }
  }

  /**
   * Handle going back to home page
   * Called when user clicks back button or presses Escape
   */
  function handleGoHome() {
    stopTimer()
    discardGame()
    router.push({ name: '/' })
  }

  return {
    handleNextCard,
    handleGoHome
  }
}
