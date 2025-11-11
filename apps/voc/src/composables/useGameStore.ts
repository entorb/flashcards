import { type AnswerResult, createBaseGameStore } from '@flashcards/shared'
import { computed, watch } from 'vue'

import { INITIAL_CARDS, MAX_LEVEL, MAX_TIME, MIN_LEVEL, MIN_TIME } from '../constants'
import { selectCardsForRound } from '../services/cardSelector'
import { calculatePoints } from '../services/pointsCalculation'
import {
  loadCards,
  loadGameStats,
  loadHistory,
  saveCards,
  saveGameStats,
  saveHistory,
  saveLastSettings,
  loadLastSettings,
  clearGameState as storageClearGameState,
  loadGameSettings as storageLoadGameSettings,
  loadGameState as storageLoadGameState,
  saveGameSettings as storageSaveGameSettings,
  saveGameState as storageSaveGameState,
  setGameResult as storageSetGameResult,
  loadDecks,
  saveDecks
} from '../services/storage'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'

// Create base store with shared state and logic
const baseStore = createBaseGameStore<Card, GameHistory, GameSettings>({
  loadCards,
  loadHistory,
  saveHistory,
  loadGameStats,
  saveGameStats,
  saveCards
})

// Deck management functions
function getDecks(): CardDeck[] {
  return loadDecks()
}

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

export function useGameStore() {
  // Initialize store on first use
  baseStore.initializeStore()

  // Restore game state and settings if page was reloaded during a game
  const savedGameState = storageLoadGameState()
  const savedGameSettings = storageLoadGameSettings()

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
    storageSaveGameSettings(settings)
    baseStore.gameSettings.value = settings
    baseStore.gameCards.value = selectCardsForRound(
      baseStore.allCards.value,
      settings.focus,
      settings.mode
    )
    baseStore.resetGameState()
  }

  function handleAnswer(result: AnswerResult, answerTime?: number) {
    const currentCard = baseStore.gameCards.value[baseStore.currentCardIndex.value]
    if (!currentCard || !baseStore.gameSettings.value) return

    if (result === 'correct') {
      baseStore.correctAnswersCount.value++
    }

    // Calculate and apply points
    const pointsEarned = calculatePoints(
      result,
      currentCard,
      baseStore.gameSettings.value,
      answerTime
    )
    baseStore.points.value += pointsEarned

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

        // Update time (only on correct answers for blind/typing modes)
        if (result === 'correct' && answerTime !== undefined) {
          const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
          const settings = baseStore.gameSettings.value
          if (settings?.mode === 'blind') {
            updates.time_blind = clampedTime
          } else if (settings?.mode === 'typing') {
            updates.time_typing = clampedTime
          }
        }

        return { ...card, ...updates }
      }
      return card
    })
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

  function resetCardsToDefaultSet() {
    baseStore.allCards.value = INITIAL_CARDS
    // Explicitly save to ensure cards are persisted immediately
    saveCards(INITIAL_CARDS)
  }

  function importCards(newCards: Card[]) {
    baseStore.allCards.value = newCards
    // Explicitly save to ensure cards are persisted immediately
    saveCards(newCards)
  }

  function moveAllCards(level: number) {
    if (level < MIN_LEVEL || level > MAX_LEVEL) return
    baseStore.allCards.value = baseStore.allCards.value.map(card => ({ ...card, level }))
  }

  function discardGame() {
    // Clear game state from sessionStorage when user abandons the game
    storageClearGameState()
    // Reset game state in memory (delegated to base store)
    baseStore.discardGame()
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

  // Computed
  const currentCard = computed(() => {
    return baseStore.gameCards.value[baseStore.currentCardIndex.value] || null
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

    // Actions
    startGame,
    handleAnswer,
    nextCard: baseStore.nextCard,
    finishGame,
    discardGame,
    resetCards: resetCardsToDefaultSet,
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
