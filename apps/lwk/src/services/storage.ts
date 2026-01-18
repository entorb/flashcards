/**
 * LWK App - Storage Service
 * Handles localStorage operations for decks, cards, history, settings, and stats
 */

import type { GameResult } from '@flashcards/shared'
import {
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  incrementDailyGames as sharedIncrementDailyGames,
  saveJSON
} from '@flashcards/shared'

import { DEFAULT_DECKS } from '../constants'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'
import { STORAGE_KEYS } from '../types'

// Game persistence factory for session storage
interface GameState {
  gameCards: Card[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
  showWord: boolean
  countdown: number
}

const gamePersistence = createGamePersistence<GameSettings, GameState>(
  STORAGE_KEYS.GAME_CONFIG,
  STORAGE_KEYS.GAME_STATE
)

// ============================================================================
// Decks
// ============================================================================

/**
 * Load all card decks from storage
 */
export function loadDecks(): CardDeck[] {
  const stored = localStorage.getItem(STORAGE_KEYS.DECKS)
  if (!stored) {
    saveDecks(DEFAULT_DECKS)
    return DEFAULT_DECKS
  }
  try {
    const parsed = JSON.parse(stored) as CardDeck[]
    return parsed
  } catch {
    saveDecks(DEFAULT_DECKS)
    return DEFAULT_DECKS
  }
}

/**
 * Save all card decks to storage
 */
export function saveDecks(decks: CardDeck[]): void {
  saveJSON(STORAGE_KEYS.DECKS, decks)
}

/**
 * Get current deck name from settings
 */
// NOTE: Logic for determining the current deck name is now inlined
// where needed (e.g., in loadCards) to avoid duplicating logic
// defined elsewhere (such as in useGameStore.ts).

// ============================================================================
// Cards (operates on current deck)
// ============================================================================

/**
 * Load cards from current deck
 */
export function loadCards(): Card[] {
  const decks = loadDecks()
  const settings = loadLastSettings()
  const currentDeckName = settings?.deck || DEFAULT_DECKS[0].name
  const deck = decks.find(d => d.name === currentDeckName)
  return deck?.cards || []
}

/**
 * Save cards to current deck
 */
export function saveCards(cards: Card[]): void {
  const decks = loadDecks()
  const settings = loadLastSettings()
  const currentDeckName = settings?.deck || DEFAULT_DECKS[0].name
  const deckIndex = decks.findIndex(d => d.name === currentDeckName)
  if (deckIndex !== -1) {
    decks[deckIndex].cards = cards
    saveDecks(decks)
  }
}

/**
 * Update a single card
 */
export function updateCard(updatedCard: Card): void {
  const cards = loadCards()
  const index = cards.findIndex(c => c.word === updatedCard.word)
  if (index !== -1) {
    cards[index] = updatedCard
    saveCards(cards)
  }
}

/**
 * Update multiple cards
 */
export function updateCards(updatedCards: Card[]): void {
  const cards = loadCards()
  for (const updatedCard of updatedCards) {
    const index = cards.findIndex(c => c.word === updatedCard.word)
    if (index !== -1) {
      cards[index] = updatedCard
    }
  }
  saveCards(cards)
}

// ============================================================================
// History
// ============================================================================

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY)

export const loadHistory = historyOps.load
export const saveHistory = historyOps.save
export const addHistoryEntry = historyOps.add

// ============================================================================
// Statistics
// ============================================================================

const DEFAULT_STATS = {
  gamesPlayed: 0,
  points: 0,
  correctAnswers: 0
}

const statsOps = createStatsOperations(STORAGE_KEYS.STATS, DEFAULT_STATS)

export const loadStats = statsOps.load
export const saveStats = statsOps.save
export const updateStats = statsOps.update

// ============================================================================
// Settings
// ============================================================================

/**
 * Load last game settings
 */
export function loadLastSettings(): GameSettings | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_SETTINGS)
  if (!stored) {
    return null
  }
  try {
    return JSON.parse(stored) as GameSettings
  } catch {
    return null
  }
}

/**
 * Save game settings
 */
export function saveLastSettings(settings: GameSettings): void {
  saveJSON(STORAGE_KEYS.LAST_SETTINGS, settings)
}

// ============================================================================
// Game Persistence (sessionStorage)
// ============================================================================

export const saveGameConfig = gamePersistence.saveSettings
export const loadGameConfig = gamePersistence.loadSettings
export const clearGameConfig = gamePersistence.clearSettings
export const saveGameState = gamePersistence.saveState
export const loadGameState = gamePersistence.loadState
export const clearGameState = gamePersistence.clearState

// ============================================================================
// Game Result (sessionStorage)
// ============================================================================

export function setGameResult(result: GameResult): void {
  sessionStorage.setItem(STORAGE_KEYS.GAME_RESULT, JSON.stringify(result))
}

export function getGameResult(): GameResult | null {
  const stored = sessionStorage.getItem(STORAGE_KEYS.GAME_RESULT)
  if (!stored) return null
  try {
    return JSON.parse(stored) as GameResult
  } catch {
    return null
  }
}

export function clearGameResult(): void {
  sessionStorage.removeItem(STORAGE_KEYS.GAME_RESULT)
}

// ============================================================================
// Daily Stats
// ============================================================================

export function incrementDailyGames(): { isFirstGame: boolean; gamesPlayedToday: number } {
  const result = sharedIncrementDailyGames(STORAGE_KEYS.DAILY_STATS)
  return {
    isFirstGame: result.isFirstGame,
    gamesPlayedToday: result.gamesPlayedToday
  }
}
