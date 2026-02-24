/**
 * LWK App - Game Store (Composable)
 * Manages game state, cards, settings, and deck operations
 */

import {
  type AnswerStatus,
  createBaseGameStore,
  roundTime,
  MAX_LEVEL,
  MAX_TIME,
  MIN_LEVEL,
  MIN_TIME,
  calculatePointsBreakdown,
  initializeGameFlow,
  useDeckManagement,
  filterLevel1Cards,
  repeatCards,
  LOOP_COUNT,
  handleNextCard,
  type SessionMode
} from '@flashcards/shared'
import { computed, ref } from 'vue'

import { DEFAULT_DECKS, GAME_STATE_FLOW_CONFIG, POINTS_MODE_HIDDEN } from '../constants'
import { selectCards } from '../services/cardSelector'
import {
  clearGameState,
  loadCards,
  loadDecks,
  loadGameState,
  loadHistory,
  loadSettings,
  loadGameStats,
  saveCards,
  saveDecks,
  saveGameConfig,
  saveGameState,
  saveHistory,
  saveSettings,
  saveGameStats,
  setGameResult
} from '../services/storage'
import type { Card, GameHistory, GameSettings } from '../types'

// Create base store with shared state and logic
const baseStore = createBaseGameStore<Card, GameHistory, GameSettings>({
  loadCards,
  loadHistory,
  saveHistory,
  loadGameStats,
  saveGameStats,
  saveCards
})

// Deck management composable
const deckManagement = useDeckManagement<Card, GameSettings>({
  loadDecks,
  saveDecks,
  loadSettings,
  saveSettings
})

// ============================================================================
// Main Game Store
// ============================================================================

export function useGameStore() {
  // Initialize store on first use
  baseStore.initializeStore()

  // Track initial card count for endless mode (where gameCards shrinks)
  const initialCardCount = ref(0)

  // Restore game state and settings if page was reloaded during a game
  // Only restore if there was an active game saved
  const savedGameState = loadGameState()

  if (savedGameState && savedGameState.gameCards.length > 0) {
    // Restore game settings from saved state (for page reload recovery)
    baseStore.gameSettings.value = savedGameState.gameSettings
    // Restore game state
    baseStore.gameCards.value = savedGameState.gameCards
    baseStore.currentCardIndex.value = savedGameState.currentCardIndex
    baseStore.points.value = savedGameState.points
    baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
    baseStore.sessionMode.value = savedGameState.sessionMode ?? 'standard'
    initialCardCount.value = savedGameState.initialCardCount ?? savedGameState.gameCards.length
  }

  // ============================================================================
  // Game Actions
  // ============================================================================

  // Helper function to save current game state to sessionStorage
  function saveCurrentGameState() {
    saveGameState({
      gameCards: baseStore.gameCards.value,
      currentCardIndex: baseStore.currentCardIndex.value,
      points: baseStore.points.value,
      correctAnswersCount: baseStore.correctAnswersCount.value,
      showWord: false,
      countdown: 0,
      gameSettings: baseStore.gameSettings.value as GameSettings,
      sessionMode: baseStore.sessionMode.value,
      initialCardCount: initialCardCount.value
    })
  }

  // Wrap nextCard to save state and handle endless mode
  const baseNextCard = baseStore.nextCard
  function nextCard(): boolean {
    const isGameOver = handleNextCard(
      baseStore.gameCards,
      baseStore.currentCardIndex,
      baseStore.sessionMode.value,
      baseNextCard,
      (c: Card) => c.word
    )

    if (!isGameOver) {
      saveCurrentGameState()
    }
    return isGameOver
  }

  function startGame(settings: GameSettings, mode: SessionMode = 'standard') {
    // Only start a new game if there are no cards in session storage (new game)
    // If cards exist, user reloaded page during game - just resume (return early)
    if (baseStore.gameCards.value.length > 0) {
      return
    }

    // Ensure the correct deck is loaded before starting the game
    if (settings.deck !== undefined && settings.deck.length > 0) {
      switchDeck(settings.deck)
    }

    saveGameConfig(settings)
    baseStore.gameSettings.value = settings
    baseStore.resetGameState()
    baseStore.sessionMode.value = mode

    let selectedCards: Card[]

    if (mode === 'endless-level1') {
      // Endless Level 1: filter all Level 1 cards from the current pool (respecting deck selection)
      selectedCards = filterLevel1Cards(baseStore.allCards.value)
    } else if (mode === '3-rounds') {
      // 3 Rounds: select cards via focus logic, then repeat each LOOP_COUNT times
      const focusSelected = selectCards(baseStore.allCards.value, settings.mode, settings.focus)
      selectedCards = repeatCards(focusSelected, LOOP_COUNT)
    } else {
      // Standard mode: existing behavior
      selectedCards = selectCards(baseStore.allCards.value, settings.mode, settings.focus)
    }

    // Use centralized game state flow to store settings + selected cards
    initializeGameFlow(GAME_STATE_FLOW_CONFIG, settings, selectedCards)

    baseStore.gameCards.value = selectedCards
    initialCardCount.value = selectedCards.length
    saveCurrentGameState()
  }

  function handleAnswer(result: AnswerStatus, answerTime: number) {
    const currentCard = baseStore.gameCards.value[baseStore.currentCardIndex.value]
    if (!currentCard || !baseStore.gameSettings.value) return

    let speedBonus = false

    if (result === 'correct' || result === 'close') {
      // Speed bonus only in hidden mode and only for correct answers
      if (result === 'correct' && baseStore.gameSettings.value.mode === 'hidden') {
        if (currentCard.time < MAX_TIME && answerTime <= currentCard.time) {
          speedBonus = true
        }
      }

      // Determine mode multiplier
      const modePoints = baseStore.gameSettings.value.mode === 'hidden' ? POINTS_MODE_HIDDEN : 1

      const pointsBreakdown = calculatePointsBreakdown({
        difficultyPoints: modePoints,
        level: currentCard.level,
        timeBonus: speedBonus,
        closeAdjustment: result === 'close'
      })

      baseStore.handleAnswerBase(result, pointsBreakdown)
    }

    // Update card level and time
    baseStore.allCards.value = baseStore.allCards.value.map(card => {
      if (card.word === currentCard.word) {
        const updates: Partial<Card> = {}

        // Update level (not for close matches)
        if (result === 'correct') {
          updates.level = Math.min(MAX_LEVEL, card.level + 1)
        } else if (result === 'incorrect') {
          updates.level = Math.max(MIN_LEVEL, card.level - 1)
        }

        // Update time (only on correct answers in hidden mode)
        if (result === 'correct' && baseStore.gameSettings.value?.mode === 'hidden') {
          const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
          updates.time = roundTime(clampedTime)
        }

        return { ...card, ...updates }
      }
      return card
    })

    // Also update the in-memory gameCards entry (needed for endless mode card removal check)
    if (result === 'correct') {
      currentCard.level = Math.min(MAX_LEVEL, currentCard.level + 1)
      if (baseStore.gameSettings.value.mode === 'hidden') {
        const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
        currentCard.time = roundTime(clampedTime)
      }
    } else if (result === 'incorrect') {
      currentCard.level = Math.max(MIN_LEVEL, currentCard.level - 1)
    }

    // Explicitly save cards on every answer
    saveCards(baseStore.allCards.value)

    // Save game state to sessionStorage for page reload persistence
    saveCurrentGameState()
  }

  function finishGame() {
    const resolvedSettings = baseStore.gameSettings.value
    if (!resolvedSettings) return

    // For endless mode, gameCards is empty at game end, so use initialCardCount
    const totalCards =
      baseStore.sessionMode.value === 'endless-level1'
        ? initialCardCount.value
        : baseStore.gameCards.value.length

    const historyEntry: GameHistory = {
      date: new Date().toISOString(),
      points: baseStore.points.value,
      settings: resolvedSettings,
      correctAnswers: baseStore.correctAnswersCount.value,
      totalCards
    }

    // Update history and stats in memory only - GameOverPage will save to localStorage
    baseStore.history.value = [...baseStore.history.value, historyEntry]
    baseStore.gameStats.value.gamesPlayed++
    // points and correctAnswers already persisted per-answer in handleAnswerBase

    // Save game result to sessionStorage for GameOverPage
    setGameResult({
      points: baseStore.points.value,
      correctAnswers: baseStore.correctAnswersCount.value,
      totalCards
    })

    // Clear game state from sessionStorage
    clearGameState()

    // Clear session mode
    baseStore.sessionMode.value = 'standard'

    // Reset in-memory game state
    baseStore.resetGameState()
    // Clear game cards to ensure fresh load from localStorage on next game start
    baseStore.gameCards.value = []
  }

  function discardGame() {
    // Clear game state from sessionStorage when user abandons the game
    clearGameState()
    // Reset game state in memory
    baseStore.discardGame()
  }

  function resetCardsToDefault() {
    // Delete all decks and reset to default set only
    const defaultDeck = DEFAULT_DECKS[0]
    if (defaultDeck === undefined) return

    // Save only the default deck
    saveDecks([defaultDeck])
    baseStore.allCards.value = defaultDeck.cards

    // Update settings to use the default deck
    const currentSettings = loadSettings()
    if (currentSettings) {
      currentSettings.deck = defaultDeck.name
      saveSettings(currentSettings)
    }
  }

  function importCards(newCards: Card[]) {
    if (newCards.length === 0) return
    // Ensure all cards have non-empty word strings
    const validCards = newCards.filter(c => c.word.trim().length > 0)
    if (validCards.length === 0) return
    baseStore.allCards.value = validCards
    // Explicitly save to ensure cards are persisted immediately
    saveCards(validCards)
  }

  function switchDeck(deckName: string) {
    const decks = loadDecks()
    const deck = decks.find(d => d.name === deckName)
    if (!deck) {
      return
    }
    // Update all cards to the new deck's cards
    baseStore.allCards.value = deck.cards
  }

  function removeDeckAndSwitch(name: string): boolean {
    const settings = loadSettings()
    const firstDeck = DEFAULT_DECKS[0]
    const currentDeck = settings?.deck ?? (firstDeck ? firstDeck.name : '')
    const isCurrentDeck = currentDeck === name

    const success = deckManagement.removeDeck(name)

    if (success && isCurrentDeck) {
      // Active deck was removed, switch to the new default deck
      const newSettings = loadSettings()
      if (newSettings?.deck !== undefined && newSettings.deck !== '') {
        switchDeck(newSettings.deck)
      }
    }
    return success
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  const currentCard = computed(() => {
    return baseStore.gameCards.value[baseStore.currentCardIndex.value] ?? null
  })

  const isEisiHappy = computed(() => {
    return baseStore.points.value > baseStore.gameCards.value.length * 5
  })

  return {
    // State (from base store)
    allCards: baseStore.allCards,
    gameCards: baseStore.gameCards,
    gameSettings: baseStore.gameSettings,
    sessionMode: baseStore.sessionMode,
    currentCardIndex: baseStore.currentCardIndex,
    points: baseStore.points,
    correctAnswersCount: baseStore.correctAnswersCount,
    history: baseStore.history,
    gameStats: baseStore.gameStats,
    currentCard,
    isEisiHappy,
    lastPointsBreakdown: baseStore.lastPointsBreakdown,

    // Actions
    startGame,
    handleAnswer,
    nextCard,
    finishGame,
    discardGame,
    resetCards: resetCardsToDefault,
    importCards,
    moveAllCards: baseStore.moveAllCards,

    // Deck management
    getDecks: deckManagement.getDecks,
    addDeck: deckManagement.addDeck,
    removeDeck: removeDeckAndSwitch,
    renameDeck: deckManagement.renameDeck,
    switchDeck
  }
}
