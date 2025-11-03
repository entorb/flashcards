import { computed, watch } from 'vue'
import type { Card, GameHistory, GameSettings } from '@/types'
import { createBaseGameStore } from '@flashcards/shared'
import {
  loadCards as storageLoadCards,
  loadRange as storageLoadRange,
  getVirtualCardsForRange,
  initializeCards,
  updateCard as storageUpdateCard,
  setGameResult as storageSetGameResult,
  getGameConfig as storageGetGameConfig,
  setGameConfig as storageSetGameConfig,
  loadGameStats as storageLoadGameStats,
  loadHistory as storageLoadHistory,
  saveHistory as storageSaveHistory,
  saveGameStats as storageSaveGameStats,
  saveGameState as storageSaveGameState,
  loadGameState as storageLoadGameState,
  clearGameState as storageClearGameState
} from '@/services/storage'
import {
  selectCards,
  filterCardsBySelection,
  filterCardsSquares,
  filterCardsAll
} from '@/services/cardSelector'
import { MIN_CARD_LEVEL, MAX_CARD_LEVEL, MAX_CARDS_PER_GAME } from '@/constants'

export interface AnswerData {
  isCorrect: boolean
  userAnswer: number
  basePoints: number
  levelBonus: number
  speedBonus: number
  totalPoints: number
  timeTaken: number
}

// Create base store with shared state and logic
const baseStore = createBaseGameStore<Card, GameHistory, GameSettings>({
  loadCards: storageLoadCards,
  loadHistory: storageLoadHistory,
  saveHistory: storageSaveHistory,
  loadGameStats: storageLoadGameStats,
  saveGameStats: storageSaveGameStats
  // Note: No saveCards for 1x1, updates are handled by updateCard
})

export function useGameStore() {
  // Initialize store on first use
  baseStore.initializeStore()

  // Load game config from storage
  const savedConfig = storageGetGameConfig()
  if (savedConfig && !baseStore.gameSettings.value) {
    baseStore.gameSettings.value = savedConfig
  }

  // Restore game state if page was reloaded during a game
  const savedGameState = storageLoadGameState()

  if (savedGameState) {
    baseStore.gameCards.value = savedGameState.gameCards
    baseStore.currentCardIndex.value = savedGameState.currentCardIndex
    baseStore.points.value = savedGameState.points
    baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
  }

  // Save game state whenever it changes for reload recovery
  const saveGameStateDebounced = () => {
    storageSaveGameState({
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
    saveGameStateDebounced
  )

  // App-specific actions
  function startGame(settings: GameSettings) {
    // Only start a new game if there are no cards in game cards (new game)
    // If cards exist, user reloaded page during game - just resume (return early)
    if (baseStore.gameCards.value.length > 0) {
      return
    }

    // Initialize base cards on first game start (if no cards exist)
    const existingCards = storageLoadCards()
    if (existingCards.length === 0) {
      // First time user clicks Start - initialize base cards
      initializeCards()
    }

    storageSetGameConfig(settings)
    baseStore.gameSettings.value = settings
    baseStore.resetGameState()

    // Get virtual cards for current range (includes non-existent cards with defaults)
    const range = storageLoadRange()
    const allAvailableCards = getVirtualCardsForRange(range)
    const rangeSet = new Set(range)

    // Filter cards based on selection type
    let filteredCards: Card[]

    if (settings.select === 'x²') {
      filteredCards = filterCardsSquares(allAvailableCards, rangeSet)
    } else if (settings.select === 'all') {
      filteredCards = filterCardsAll(allAvailableCards, rangeSet)
    } else {
      const selectArray = Array.isArray(settings.select) ? settings.select : []
      filteredCards = filterCardsBySelection(allAvailableCards, selectArray, rangeSet)
    }

    baseStore.gameCards.value = selectCards(filteredCards, settings.focus, MAX_CARDS_PER_GAME)
  }

  function handleAnswer(data: AnswerData) {
    const card = currentCard.value
    if (!card || !baseStore.gameSettings.value) return

    if (data.isCorrect) {
      baseStore.points.value += data.totalPoints
      baseStore.correctAnswersCount.value++

      const newLevel = Math.min(card.level + 1, MAX_CARD_LEVEL)
      storageUpdateCard(card.question, {
        level: newLevel,
        time: data.timeTaken
      })
    } else {
      const newLevel = Math.max(card.level - 1, MIN_CARD_LEVEL)
      storageUpdateCard(card.question, {
        level: newLevel
      })
    }
  }

  function finishGame() {
    if (!baseStore.gameSettings.value) return

    const settingsForHistory = { ...baseStore.gameSettings.value }
    const range = storageLoadRange()
    const rangeSet = new Set(range)

    // If all values in current range are selected, show as 'all'
    if (
      Array.isArray(baseStore.gameSettings.value.select) &&
      baseStore.gameSettings.value.select.length === range.length &&
      baseStore.gameSettings.value.select.every(num => rangeSet.has(num))
    ) {
      settingsForHistory.select = 'all'
    }

    const historyEntry: GameHistory = {
      date: new Date().toISOString(),
      settings: settingsForHistory,
      points: baseStore.points.value,
      correctAnswers: baseStore.correctAnswersCount.value
    }

    // Store the history entry in memory for GameOverPage to persist
    baseStore.history.value = [...baseStore.history.value, historyEntry]
    // Update game stats in memory for GameOverPage to persist
    baseStore.gameStats.value.gamesPlayed++
    baseStore.gameStats.value.points += baseStore.points.value
    baseStore.gameStats.value.correctAnswers += baseStore.correctAnswersCount.value

    storageSetGameResult({
      points: baseStore.points.value,
      correctAnswers: baseStore.correctAnswersCount.value,
      totalCards: baseStore.gameCards.value.length
    })

    // Clear game state after finishing (sessionStorage and in-memory state)
    storageClearGameState()
    baseStore.discardGame()
  }

  function discardGame() {
    // Clear game state from sessionStorage when user abandons the game
    storageClearGameState()
    // Reset game state in memory (delegated to base store)
    baseStore.discardGame()
  }

  // Computed
  const currentCard = computed(() => {
    return baseStore.gameCards.value[baseStore.currentCardIndex.value] || null
  })

  return {
    // State (from base store)
    allCards: baseStore.allCards,
    gameCards: baseStore.gameCards,
    gameSettings: baseStore.gameSettings,
    currentCardIndex: baseStore.currentCardIndex,
    points: baseStore.points,
    correctAnswersCount: baseStore.correctAnswersCount,
    history: baseStore.history,
    gameStats: baseStore.gameStats,
    currentCard,

    // Actions
    startGame,
    handleAnswer,
    nextCard: baseStore.nextCard,
    finishGame,
    discardGame
  }
}
