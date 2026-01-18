/**
 * LWK App - Game Store (Composable)
 * Manages game state, cards, settings, and deck operations
 */

import { type AnswerResult, createBaseGameStore } from '@flashcards/shared'
import { computed, watch } from 'vue'

import {
  DEFAULT_DECKS,
  MAX_LEVEL,
  MAX_TIME,
  MIN_LEVEL,
  MIN_TIME,
  SPEED_BONUS_POINTS
} from '../constants'
import { selectCards } from '../services/cardSelector'
import {
  clearGameState,
  loadCards,
  loadDecks,
  loadGameConfig,
  loadGameState,
  loadHistory,
  loadLastSettings,
  loadStats,
  saveCards,
  saveDecks,
  saveGameConfig,
  saveGameState,
  saveHistory,
  saveLastSettings,
  saveStats,
  setGameResult
} from '../services/storage'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'
import { calculateSpellingPoints } from '../utils/helpers'

// Create base store with shared state and logic
const baseStore = createBaseGameStore<Card, GameHistory, GameSettings>({
  loadCards,
  loadHistory,
  saveHistory,
  loadGameStats: loadStats,
  saveGameStats: saveStats,
  saveCards
})

// ============================================================================
// Deck Management
// ============================================================================

// Track current deck name
const currentDeck = computed(() => {
  const lastSettings = loadLastSettings()
  return lastSettings?.deck || DEFAULT_DECKS[0].name
})

function getDecks(): CardDeck[] {
  return loadDecks()
}

function addDeck(name: string): boolean {
  const decks = loadDecks()
  // Check for duplicate name
  if (decks.some(d => d.name === name)) {
    return false
  }
  decks.push({ name, cards: [] })
  saveDecks(decks)
  return true
}

function renameDeck(oldName: string, newName: string): boolean {
  const decks = loadDecks()
  // Check for duplicate name
  if (decks.some(d => d.name === newName)) {
    return false
  }
  const deck = decks.find(d => d.name === oldName)
  if (!deck) {
    return false
  }
  deck.name = newName
  saveDecks(decks)
  // Update settings if current deck was renamed
  const settings = loadLastSettings()
  if (settings?.deck === oldName) {
    settings.deck = newName
    saveLastSettings(settings)
  }
  return true
}

function removeDeck(name: string): boolean {
  const decks = loadDecks()
  // Cannot remove last deck
  if (decks.length <= 1) {
    return false
  }
  const filtered = decks.filter(d => d.name !== name)
  if (filtered.length === decks.length) {
    return false // Deck not found
  }
  saveDecks(filtered)
  // If current deck was removed, update settings and switch to a new default
  const settings = loadLastSettings()
  if (settings?.deck === name) {
    const newDeck = filtered[0]
    settings.deck = newDeck.name
    saveLastSettings(settings)
    // Load cards directly from the deck we already have in memory
    baseStore.allCards.value = newDeck.cards
  }
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

// ============================================================================
// Main Game Store
// ============================================================================

export function useGameStore() {
  // Initialize store on first use
  baseStore.initializeStore()

  // Restore game state and settings if page was reloaded during a game
  const savedGameState = loadGameState()
  const savedGameSettings = loadGameConfig()

  if (savedGameState && savedGameSettings) {
    // Restore game settings
    baseStore.gameSettings.value = savedGameSettings
    // Restore game state
    baseStore.gameCards.value = savedGameState.gameCards
    baseStore.currentCardIndex.value = savedGameState.currentCardIndex
    baseStore.points.value = savedGameState.points
    baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
  }

  // Save game state whenever it changes for reload recovery
  const saveGameStateDebounced = () => {
    saveGameState({
      gameCards: baseStore.gameCards.value,
      currentCardIndex: baseStore.currentCardIndex.value,
      points: baseStore.points.value,
      correctAnswersCount: baseStore.correctAnswersCount.value,
      showWord: false,
      countdown: 0
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

  // ============================================================================
  // Game Actions
  // ============================================================================

  function startGame(settings: GameSettings) {
    // Only start a new game if there are no cards in session storage (new game)
    // If cards exist, user reloaded page during game - just resume (return early)
    if (baseStore.gameCards.value.length > 0) {
      return
    }

    // Ensure the correct deck is loaded before starting the game
    if (settings.deck) {
      switchDeck(settings.deck)
    }

    saveLastSettings(settings)
    saveGameConfig(settings)
    baseStore.gameSettings.value = settings
    baseStore.gameCards.value = selectCards(baseStore.allCards.value, settings.mode, settings.focus)
    baseStore.resetGameState()
  }

  function handleAnswer(result: AnswerResult, isCloseMatch: boolean = false, answerTime?: number) {
    const currentCard = baseStore.gameCards.value[baseStore.currentCardIndex.value]
    if (!currentCard || !baseStore.gameSettings.value) return

    let pointsEarned = 0
    let speedBonus = 0

    if (result === 'correct') {
      baseStore.correctAnswersCount.value++
      pointsEarned = calculateSpellingPoints(true, false, currentCard.level)

      // Speed bonus only in hidden mode
      if (baseStore.gameSettings.value.mode === 'hidden' && answerTime !== undefined) {
        if (answerTime < currentCard.time) {
          speedBonus = SPEED_BONUS_POINTS
          pointsEarned += speedBonus
        }
      }
    } else if (isCloseMatch) {
      // Close match: 75% points, no level change
      pointsEarned = calculateSpellingPoints(false, true, currentCard.level)
    }

    baseStore.points.value += pointsEarned

    // Update card level and time
    baseStore.allCards.value = baseStore.allCards.value.map(card => {
      if (card.word === currentCard.word) {
        const updates: Partial<Card> = {}

        // Update level (not for close matches)
        if (result === 'correct') {
          updates.level = Math.min(MAX_LEVEL, card.level + 1)
        } else if (result === 'incorrect' && !isCloseMatch) {
          updates.level = Math.max(MIN_LEVEL, card.level - 1)
        }

        // Update time (only on correct answers in hidden mode)
        if (
          result === 'correct' &&
          answerTime !== undefined &&
          baseStore.gameSettings.value?.mode === 'hidden'
        ) {
          const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
          updates.time = clampedTime
        }

        return { ...card, ...updates }
      }
      return card
    })

    // Explicitly save cards on every answer
    saveCards(baseStore.allCards.value)
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
    baseStore.gameStats.value.points += baseStore.points.value
    baseStore.gameStats.value.correctAnswers += baseStore.correctAnswersCount.value

    // Save game result to sessionStorage for GameOverPage
    setGameResult({
      points: baseStore.points.value,
      correctAnswers: baseStore.correctAnswersCount.value,
      totalCards: baseStore.gameCards.value.length
    })

    // Clear game state from sessionStorage
    clearGameState()

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
    // Reset current deck to default cards
    const decks = loadDecks()
    const currentDeckName = loadLastSettings()?.deck || DEFAULT_DECKS[0].name
    const defaultDeck = DEFAULT_DECKS.find(d => d.name === currentDeckName)

    if (defaultDeck) {
      const deckIndex = decks.findIndex(d => d.name === currentDeckName)
      if (deckIndex !== -1) {
        decks[deckIndex].cards = defaultDeck.cards
        saveDecks(decks)
        baseStore.allCards.value = defaultDeck.cards
      }
    }
  }

  function importCards(newCards: Card[]) {
    baseStore.allCards.value = newCards
    // Explicitly save to ensure cards are persisted immediately
    saveCards(newCards)
  }

  function moveAllCards(level: number) {
    if (level < MIN_LEVEL || level > MAX_LEVEL) return
    baseStore.allCards.value = baseStore.allCards.value.map(card => ({ ...card, level }))
    saveCards(baseStore.allCards.value)
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  const currentCard = computed(() => {
    return baseStore.gameCards.value[baseStore.currentCardIndex.value] || null
  })

  const isEisiHappy = computed(() => {
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
    isEisiHappy,
    currentDeck,

    // Actions
    startGame,
    handleAnswer,
    nextCard: baseStore.nextCard,
    finishGame,
    discardGame,
    resetCards: resetCardsToDefault,
    importCards,
    moveAllCards,

    // Deck management
    getDecks,
    addDeck,
    removeDeck,
    renameDeck,
    switchDeck
  }
}
