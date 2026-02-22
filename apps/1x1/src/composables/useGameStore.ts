import {
  createBaseGameStore,
  MAX_LEVEL,
  MIN_LEVEL,
  initializeGameFlow,
  roundTime,
  MIN_TIME,
  MAX_TIME,
  type AnswerStatus,
  calculatePointsBreakdown
} from '@flashcards/shared'
import { computed } from 'vue'

import { MAX_CARDS_PER_GAME, GAME_STATE_FLOW_CONFIG } from '@/constants'
import {
  filterCardsAll,
  filterCardsBySelection,
  filterCardsSquares,
  selectCardsForRound
} from '@/services/cardSelector'
import {
  getVirtualCardsForRange,
  initializeCards,
  clearGameState as storageClearGameState,
  getGameConfig as storageGetGameConfig,
  loadCards as storageLoadCards,
  loadGameState as storageLoadGameState,
  loadGameStats as storageLoadGameStats,
  loadHistory as storageLoadHistory,
  loadRange as storageLoadRange,
  saveGameState as storageSaveGameState,
  saveGameStats as storageSaveGameStats,
  saveHistory as storageSaveHistory,
  setGameConfig as storageSetGameConfig,
  setGameResult as storageSetGameResult,
  updateCard as storageUpdateCard
} from '@/services/storage'
import type { Card, GameHistory, GameSettings } from '@/types'

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
  // Only restore if there was an active game saved
  const savedGameState = storageLoadGameState()
  if (savedGameState && savedGameState.gameCards.length > 0) {
    baseStore.gameCards.value = savedGameState.gameCards
    baseStore.currentCardIndex.value = savedGameState.currentCardIndex
    baseStore.points.value = savedGameState.points
    baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
  }

  // Helper function to save current game state to sessionStorage
  function saveCurrentGameState() {
    storageSaveGameState({
      gameCards: baseStore.gameCards.value,
      currentCardIndex: baseStore.currentCardIndex.value,
      points: baseStore.points.value,
      correctAnswersCount: baseStore.correctAnswersCount.value
    })
  }

  // App-specific actions
  function startGame(settings: GameSettings, forceReset = false) {
    // If forceReset is true, always start a new game (user clicked Start button)
    // Otherwise, only start if there are no cards (handles page reload recovery)
    if (!forceReset && baseStore.gameCards.value.length > 0) {
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

    const selectedCards = selectCardsForRound(filteredCards, settings.focus, MAX_CARDS_PER_GAME)

    // Use centralized game state flow to store settings + selected cards
    initializeGameFlow(GAME_STATE_FLOW_CONFIG, settings, selectedCards)

    baseStore.gameCards.value = selectedCards

    // Save initial game state for reload recovery
    storageSaveGameState({
      gameCards: baseStore.gameCards.value,
      currentCardIndex: 0,
      points: 0,
      correctAnswersCount: 0
    })
  }

  function handleAnswer(result: AnswerStatus, answerTime: number) {
    const card = currentCard.value
    if (!card || !baseStore.gameSettings.value) return

    // difficultyPoints is the smaller factor of the multiplication (e.g. 3 for 7x3)
    const [x, y] = card.question.split('x').map(s => Number.parseInt(s, 10))
    const difficultyPoints = result === 'correct' ? Math.min(x, y) : 0

    const pointsBreakdown = calculatePointsBreakdown({
      difficultyPoints,
      level: card.level,
      timeBonus: card.time < MAX_TIME && answerTime <= card.time,
      closeAdjustment: result === 'close'
    })

    baseStore.handleAnswerBase(result, pointsBreakdown)

    if (result === 'correct' || result === 'close') {
      const newLevel = Math.min(card.level + 1, MAX_LEVEL)
      const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
      storageUpdateCard(card.question, {
        level: newLevel,
        time: roundTime(clampedTime)
      })
    } else if (result === 'incorrect') {
      const newLevel = Math.max(card.level - 1, MIN_LEVEL)
      storageUpdateCard(card.question, {
        level: newLevel
      })
    }

    // Save game state after answer
    saveCurrentGameState()
  }

  // Wrap nextCard to save state
  const baseNextCard = baseStore.nextCard
  function nextCard() {
    const isGameOver = baseNextCard()
    if (!isGameOver) {
      // Save state after moving to next card (unless game is over)
      saveCurrentGameState()
    }
    return isGameOver
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

    // Update history and stats in memory only - GameOverPage will save to localStorage
    baseStore.history.value = [...baseStore.history.value, historyEntry]
    baseStore.gameStats.value.gamesPlayed++
    baseStore.gameStats.value.points += baseStore.points.value
    baseStore.gameStats.value.correctAnswers += baseStore.correctAnswersCount.value

    // Save game result to sessionStorage for GameOverPage
    storageSetGameResult({
      points: baseStore.points.value,
      correctAnswers: baseStore.correctAnswersCount.value,
      totalCards: baseStore.gameCards.value.length
    })

    // Clear game state from sessionStorage
    storageClearGameState()

    // Reset in-memory game state to prevent "11/10" bug when starting a new game
    baseStore.resetGameState()
  }

  function discardGame() {
    // Clear game state from sessionStorage when user abandons the game
    storageClearGameState()
    // Reset game state in memory (delegated to base store)
    baseStore.discardGame()
  }

  function resetCards() {
    baseStore.resetAllCards()
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
    lastPointsBreakdown: baseStore.lastPointsBreakdown,

    // Actions
    startGame,
    handleAnswer,
    nextCard,
    finishGame,
    discardGame,
    resetCards,
    moveAllCards: baseStore.moveAllCards
  }
}
