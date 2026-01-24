/**
 * Shared Game State Recovery Pattern
 * Handles page reload recovery for all apps
 */

import type { Ref } from 'vue'
import { watch } from 'vue'

export interface RecoveryGameState {
  gameCards: unknown[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
}

/**
 * Recovery composable for game state page reload handling
 * Automatically restores game state on page load and saves on every change
 */
export function useGameStateRecovery(
  baseStore: {
    gameCards: Ref<unknown[]>
    currentCardIndex: Ref<number>
    points: Ref<number>
    correctAnswersCount: Ref<number>
  },
  saveStateFn: (state: unknown) => void,
  loadStateFn: () => RecoveryGameState | null
): void {
  // Restore game state if page was reloaded during a game
  const savedGameState = loadStateFn()

  if (savedGameState) {
    baseStore.gameCards.value = savedGameState.gameCards
    baseStore.currentCardIndex.value = savedGameState.currentCardIndex
    baseStore.points.value = savedGameState.points
    baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
  }

  // Save game state whenever it changes for reload recovery
  const saveGameState = () => {
    saveStateFn({
      gameCards: baseStore.gameCards.value,
      currentCardIndex: baseStore.currentCardIndex.value,
      points: baseStore.points.value,
      correctAnswersCount: baseStore.correctAnswersCount.value
    })
  }

  watch(
    () => [
      baseStore.gameCards.value.length,
      baseStore.currentCardIndex.value,
      baseStore.points.value,
      baseStore.correctAnswersCount.value
    ],
    saveGameState
  )
}
