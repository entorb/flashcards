/**
 * Shared Base Game Store Composable
 * Provides common state management patterns used across all apps
 */

import { type Ref, ref } from 'vue'

import { MAX_LEVEL, MIN_LEVEL, MAX_TIME } from '../constants'
import type { PointsBreakdown } from '../services/scoring'
import type { BaseCard, BaseGameHistory, GameStats } from '../types'

/**
 * Configuration for creating a base game store
 */
export interface BaseGameStoreConfig<TCard extends BaseCard, THistory extends BaseGameHistory> {
  /** Load all cards from storage */
  loadCards: () => TCard[]
  /** Load game history from storage */
  loadHistory: () => THistory[]
  /** Save game history to storage */
  saveHistory: (history: THistory[]) => void
  /** Load game statistics from storage */
  loadGameStats: () => GameStats
  /** Save game statistics to storage */
  saveGameStats: (stats: GameStats) => void
  /** Optional: Save cards to storage (for apps that modify cards) */
  saveCards?: (cards: TCard[]) => void
}

/**
 * Create a base game store with shared state and patterns
 * Apps can extend this with their specific logic
 */
export function createBaseGameStore<
  TCard extends BaseCard,
  THistory extends BaseGameHistory,
  TSettings
>(config: BaseGameStoreConfig<TCard, THistory>) {
  // Shared state
  const allCards = ref<TCard[]>([]) as Ref<TCard[]>
  const gameCards = ref<TCard[]>([]) as Ref<TCard[]>
  const gameSettings = ref<TSettings | null>(null) as Ref<TSettings | null>
  const currentCardIndex = ref(0)
  const points = ref(0)
  const correctAnswersCount = ref(0)
  const history = ref<THistory[]>([]) as Ref<THistory[]>
  const gameStats = ref<GameStats>({
    gamesPlayed: 0,
    points: 0,
    correctAnswers: 0
  })

  // Last points breakdown for display
  const lastPointsBreakdown = ref<PointsBreakdown | null>(null)

  // Initialize state from storage
  let initialized = false

  function initializeStore() {
    if (!initialized) {
      allCards.value = config.loadCards()
      history.value = config.loadHistory()
      gameStats.value = config.loadGameStats()
      initialized = true
      // Note: Cards are saved explicitly via config.saveCards when needed,
      // rather than via a watcher on card state. A previous implementation
      // used a watcher to auto-save whenever card collections changed, but
      // this could trigger additional card/state updates inside the save
      // path, leading to recursive update cycles and repeated save loops.
    }
  }

  /**
   * Reset game state for a new game
   */
  function resetGameState() {
    currentCardIndex.value = 0
    points.value = 0
    correctAnswersCount.value = 0
  }

  /**
   * Move to next card
   * @returns true if game is over, false otherwise
   */
  function nextCard(): boolean {
    currentCardIndex.value++
    return currentCardIndex.value >= gameCards.value.length
  }

  /**
   * Add game to history and update statistics
   * This is the shared pattern across all apps
   */
  function saveGameResults(historyEntry: THistory) {
    // Create a new array to ensure watchers detect the change
    history.value = [...history.value, historyEntry]
    gameStats.value.gamesPlayed++
    gameStats.value.points += points.value
    gameStats.value.correctAnswers += correctAnswersCount.value
  }

  /**
   * Discard current game and reset all game state
   * Called when user abandons game without finishing
   */
  function discardGame() {
    gameCards.value = []
    currentCardIndex.value = 0
    points.value = 0
    correctAnswersCount.value = 0
    gameSettings.value = null as unknown as TSettings
  }

  /**
   * Move all cards to a specific level
   */
  function moveAllCards(level: number) {
    if (level < MIN_LEVEL || level > MAX_LEVEL) return
    allCards.value = allCards.value.map(card => ({ ...card, level }))
    config.saveCards?.(allCards.value)
  }

  /**
   * Reset all cards to initial state (level 1, time 60s)
   */
  function resetAllCards() {
    allCards.value = allCards.value.map(card => ({ ...card, level: MIN_LEVEL, time: MAX_TIME }))
    config.saveCards?.(allCards.value)
  }

  return {
    // State
    allCards,
    gameCards,
    gameSettings,
    currentCardIndex,
    points,
    correctAnswersCount,
    history,
    gameStats,
    lastPointsBreakdown,

    // Actions
    initializeStore,
    resetGameState,
    nextCard,
    saveGameResults,
    discardGame,
    moveAllCards,
    resetAllCards
  }
}
