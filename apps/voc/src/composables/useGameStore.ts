import {
  type AnswerStatus,
  createBaseGameStore,
  MAX_LEVEL,
  MAX_TIME,
  MIN_LEVEL,
  MIN_TIME,
  initializeGameFlow,
  calculatePointsBreakdown,
  roundTime,
  useDeckManagement
} from '@flashcards/shared'
import { computed } from 'vue'

import {
  INITIAL_CARDS,
  GAME_STATE_FLOW_CONFIG,
  POINTS_MODE_BLIND,
  POINTS_MODE_TYPING,
  DEFAULT_DECKS
} from '../constants'
import { selectCardsForRound } from '../services/cardSelector'
import {
  loadCards,
  loadGameStats,
  loadHistory,
  saveCards,
  saveGameStats,
  saveHistory,
  clearGameState as storageClearGameState,
  loadGameState as storageLoadGameState,
  saveGameState as storageSaveGameState,
  setGameResult as storageSetGameResult,
  loadDecks,
  saveDecks,
  loadSettings,
  saveSettings
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

export function useGameStore() {
  // Initialize store on first use
  baseStore.initializeStore()

  // Restore game state and settings if page was reloaded during a game
  // Only restore if there was an active game saved
  const savedGameState = storageLoadGameState()

  if (savedGameState && savedGameState.gameCards.length > 0) {
    // Restore game settings from saved state
    baseStore.gameSettings.value = savedGameState.gameSettings
    // Restore game state
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
      correctAnswersCount: baseStore.correctAnswersCount.value,
      gameSettings: baseStore.gameSettings.value as GameSettings
    })
  }

  // Wrap nextCard to save state on card progression
  const baseNextCard = baseStore.nextCard
  function nextCard(): boolean {
    const isGameOver = baseNextCard()
    if (!isGameOver) {
      saveCurrentGameState()
    }
    return isGameOver
  }

  // App-specific actions
  function startGame(settings: GameSettings) {
    // Only start a new game if there are no cards in session storage (new game)
    // If cards exist, user reloaded page during game - just resume (return early)
    if (baseStore.gameCards.value.length > 0) {
      return
    }

    // Ensure the correct deck is loaded before starting the game
    if (settings.deck !== undefined && settings.deck !== '') {
      switchDeck(settings.deck)
    }

    saveSettings(settings)
    baseStore.gameSettings.value = settings
    const selectedCards = selectCardsForRound(baseStore.allCards.value, settings.focus)

    // Use centralized game state flow to store settings + selected cards
    initializeGameFlow(GAME_STATE_FLOW_CONFIG, settings, selectedCards)

    baseStore.gameCards.value = selectedCards
    baseStore.resetGameState()

    // Save initial game state to sessionStorage for page reload persistence
    saveCurrentGameState()
  }

  function handleAnswer(result: AnswerStatus, answerTime?: number) {
    const currentCard = baseStore.gameCards.value[baseStore.currentCardIndex.value]
    if (!currentCard || !baseStore.gameSettings.value) return

    // Calculate points using shared scoring logic
    // Determine mode multiplier
    const difficultyPoints = (() => {
      switch (baseStore.gameSettings.value.mode) {
        case 'blind':
          return POINTS_MODE_BLIND
        case 'typing':
          return POINTS_MODE_TYPING
        case 'multiple-choice':
          return 1
        default: {
          // Exhaustive check: TypeScript will error if a new mode is added but not handled
          const _exhaustive: never = baseStore.gameSettings.value.mode
          console.error('Unexpected game mode:', _exhaustive)
          return 1 // Fallback to multiple-choice points
        }
      }
    })()

    // Calculate language bonus
    const languageBonus =
      result === 'correct' && baseStore.gameSettings.value.language === 'de-voc' ? 1 : 0

    // Determine time bonus
    const isBeatTime =
      result === 'correct' &&
      answerTime !== undefined &&
      answerTime < MAX_TIME &&
      answerTime < currentCard.time

    const timeBonus = isBeatTime
    const closeAdjustment = result === 'close'

    const pointsBreakdown =
      result === 'incorrect'
        ? {
            levelPoints: 0,
            difficultyPoints: 0,
            pointsBeforeBonus: 0,
            closeAdjustment: 0,
            languageBonus: 0,
            timeBonus: 0,
            totalPoints: 0
          }
        : calculatePointsBreakdown({
            difficultyPoints,
            level: currentCard.level,
            timeBonus,
            closeAdjustment,
            languageBonus
          })

    baseStore.handleAnswerBase(result, pointsBreakdown)

    // Update card level and time
    baseStore.allCards.value = baseStore.allCards.value.map(card => {
      if (card.voc === currentCard.voc) {
        const updates: Partial<Card> = {}

        // Update level
        if (result === 'correct') {
          updates.level = Math.min(MAX_LEVEL, card.level + 1)
        } else if (result === 'incorrect') {
          updates.level = Math.max(MIN_LEVEL, card.level - 1)
        }

        // Update time (only on correct answers)
        if (result === 'correct' && answerTime !== undefined) {
          const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
          updates.time = roundTime(clampedTime)
        }

        return { ...card, ...updates }
      }
      return card
    })

    // Explicitly save cards on every answer because the watcher in the base store
    // doesn't seem to fire consistently. This is a workaround to ensure data is saved.
    saveCards(baseStore.allCards.value)

    // Save game state to sessionStorage for page reload persistence
    saveCurrentGameState()
  }

  function finishGame() {
    if (!baseStore.gameSettings.value) return

    const historyEntry: GameHistory = {
      date: new Date().toISOString(),
      points: baseStore.points.value,
      settings: baseStore.gameSettings.value,
      correctAnswers: baseStore.correctAnswersCount.value
    }

    // Update history and stats in memory only - GameOverPage will save to localStorage
    baseStore.history.value = [...baseStore.history.value, historyEntry]
    baseStore.gameStats.value.gamesPlayed++
    // points and correctAnswers already persisted per-answer in handleAnswerBase

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
    // Clear game cards to ensure fresh load from localStorage on next game start
    baseStore.gameCards.value = []
  }

  function resetCardsToDefaultSet() {
    baseStore.allCards.value = INITIAL_CARDS
    // Explicitly save to ensure cards are persisted immediately
    saveCards(INITIAL_CARDS)
  }

  function importCards(newCards: Card[]) {
    if (newCards.length === 0) return
    // Ensure all cards have non-empty voc and de strings
    const validCards = newCards.filter(c => c.voc.trim().length > 0 && c.de.trim().length > 0)
    if (validCards.length === 0) return
    baseStore.allCards.value = validCards
    // Explicitly save to ensure cards are persisted immediately
    saveCards(validCards)
  }

  function discardGame() {
    // Clear game state from sessionStorage when user abandons the game
    storageClearGameState()
    // Reset game state in memory (delegated to base store)
    baseStore.discardGame()
  }

  // Wrapper for addDeck to initialize with INITIAL_CARDS
  function addDeck(name: string): boolean {
    const decks = loadDecks()
    // Check for duplicate name
    if (decks.some(d => d.name === name)) {
      return false
    }
    decks.push({ name, cards: [...INITIAL_CARDS] })
    saveDecks(decks)
    return true
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

  // Computed
  const currentCard = computed(() => {
    return baseStore.gameCards.value[baseStore.currentCardIndex.value] ?? null
  })

  const isFoxHappy = computed(() => {
    return baseStore.points.value > baseStore.gameCards.value.length * 5
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
    isFoxHappy,
    lastPointsBreakdown: baseStore.lastPointsBreakdown,

    // Actions
    startGame,
    handleAnswer,
    nextCard,
    finishGame,
    discardGame,
    resetCards: resetCardsToDefaultSet,
    importCards,
    moveAllCards: baseStore.moveAllCards,

    // Deck management
    getDecks: deckManagement.getDecks,
    addDeck,
    removeDeck: removeDeckAndSwitch,
    renameDeck: deckManagement.renameDeck,
    switchDeck
  }
}
