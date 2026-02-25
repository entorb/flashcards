/**
 * LWK App - Storage Service
 * Handles localStorage operations for decks, cards, history, settings, and stats
 */

import type { GameResult, SessionMode } from '@flashcards/shared'
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
  gameSettings: GameSettings
  sessionMode?: SessionMode
  initialCardCount?: number
}

const gamePersistence = createGamePersistence<GameSettings, GameState>(
  STORAGE_KEYS.SELECTED_CARDS,
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
  if (stored === null || stored === '') {
    saveDecks(DEFAULT_DECKS)
    return DEFAULT_DECKS
  }
  try {
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveDecks(DEFAULT_DECKS)
      return DEFAULT_DECKS
    }
    // Validate each deck has required structure
    const decks = parsed as CardDeck[]
    const valid = decks.every(
      d => typeof d.name === 'string' && d.name.length > 0 && Array.isArray(d.cards)
    )
    if (!valid) {
      saveDecks(DEFAULT_DECKS)
      return DEFAULT_DECKS
    }
    return decks
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
/**
 * Get current deck name from settings, falling back to first default deck
 */
function getCurrentDeckName(): string {
  const settings = loadSettings()
  const firstDeck = DEFAULT_DECKS[0]
  return settings?.deck ?? (firstDeck ? firstDeck.name : '')
}

// ============================================================================
// Cards (operates on current deck)
// ============================================================================

/**
 * Load cards from current deck
 */
export function loadCards(): Card[] {
  const decks = loadDecks()
  const deck = decks.find(d => d.name === getCurrentDeckName())
  return deck?.cards ?? []
}

/**
 * Save cards to current deck
 */
export function saveCards(cards: Card[]): void {
  const decks = loadDecks()
  const deckIndex = decks.findIndex(d => d.name === getCurrentDeckName())
  if (deckIndex !== -1) {
    const deck = decks[deckIndex]
    if (deck) {
      deck.cards = cards
      saveDecks(decks)
    }
  }
}

// ============================================================================
// History
// ============================================================================

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY)

export function loadHistory(): GameHistory[] {
  return historyOps.load()
}

export function saveHistory(history: GameHistory[]): void {
  historyOps.save(history)
}

export function addHistory(entry: GameHistory): void {
  historyOps.add(entry)
}

// ============================================================================
// Statistics
// ============================================================================

const DEFAULT_STATS = {
  gamesPlayed: 0,
  points: 0,
  correctAnswers: 0
}

const statsOps = createStatsOperations(STORAGE_KEYS.STATS, DEFAULT_STATS)

export function loadGameStats() {
  return statsOps.load()
}

export function saveGameStats(stats: typeof DEFAULT_STATS) {
  statsOps.save(stats)
}

export function updateStatistics(points: number, correctAnswers: number) {
  return statsOps.update(points, correctAnswers)
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Load game settings
 */
export function loadSettings(): GameSettings | null {
  return loadJSON<GameSettings | null>(STORAGE_KEYS.SETTINGS, null)
}

/**
 * Save game settings
 */
export function saveSettings(settings: GameSettings): void {
  saveJSON(STORAGE_KEYS.SETTINGS, settings)
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
