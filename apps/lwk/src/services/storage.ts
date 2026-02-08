/**
 * LWK App - Storage Service
 * Handles localStorage operations for decks, cards, history, settings, and stats
 */

import type { GameResult } from '@flashcards/shared'
import {
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  createAppGameStorage,
  saveJSON,
  loadJSON
} from '@flashcards/shared'

import { DEFAULT_DECKS, STORAGE_KEYS } from '../constants'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'

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
  const settings = loadSettings()
  const currentDeckName = settings?.deck || DEFAULT_DECKS[0].name
  const deck = decks.find(d => d.name === currentDeckName)
  return deck?.cards || []
}

/**
 * Save cards to current deck
 */
export function saveCards(cards: Card[]): void {
  const decks = loadDecks()
  const settings = loadSettings()
  const currentDeckName = settings?.deck || DEFAULT_DECKS[0].name
  const deckIndex = decks.findIndex(d => d.name === currentDeckName)
  if (deckIndex !== -1) {
    decks[deckIndex].cards = cards
    saveDecks(decks)
  }
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
export const saveGameStats = statsOps.save // Alias for consistency with other apps
export const updateStats = statsOps.update

// ============================================================================
// Settings
// ============================================================================

/**
 * Load game settings
 */
export function loadSettings(): GameSettings | null {
  return loadJSON<GameSettings | null>(STORAGE_KEYS.GAME_SETTINGS, null)
}

/**
 * Save game settings
 */
export function saveSettings(settings: GameSettings): void {
  saveJSON(STORAGE_KEYS.GAME_SETTINGS, settings)
}

// ============================================================================
// Game Persistence (sessionStorage)
// ============================================================================

export const saveGameConfig = gamePersistence.saveSettings
export const loadGameConfig = gamePersistence.loadSettings
export const clearGameConfig = gamePersistence.clearSettings
export const saveGameState = gamePersistence.saveState
export const loadGameState = gamePersistence.loadState

// Game Storage Factory - Consolidates result/state/daily operations

const gameStorage = createAppGameStorage(
  STORAGE_KEYS.GAME_RESULT,
  STORAGE_KEYS.GAME_STATE,
  STORAGE_KEYS.DAILY_STATS
)

export const { clearGameState } = gameStorage

// ============================================================================
// Game Result (sessionStorage)
// ============================================================================

export function setGameResult(result: GameResult): void {
  gameStorage.setGameResult(result)
}

export function getGameResult(): GameResult | null {
  return gameStorage.getGameResult()
}

export function clearGameResult(): void {
  gameStorage.clearGameResult()
}

// ============================================================================
// Daily Stats
// ============================================================================

export function incrementDailyGames(): { isFirstGame: boolean; gamesPlayedToday: number } {
  return gameStorage.incrementDailyGames()
}
