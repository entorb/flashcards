/**
 * LWK App - Storage Service
 * Handles localStorage operations for decks, cards, history, settings, and stats
 */

import type { GameResult, SessionMode } from '@flashcards/shared'
import {
  createAppGameStorage,
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  loadJSON,
  saveJSON
} from '@flashcards/shared'
import {
  isRecord,
  isString,
  isValidBaseCard,
  isValidCardLevel,
  isValidHistoryEntry
} from '@flashcards/shared/utils'

import { DEFAULT_DECKS, STORAGE_KEYS } from '../constants'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'

/** Card shape check: word string + valid BaseCard level/time */
function isValidCard(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { word } = value
  return isString(word) && word.length > 0 && isValidBaseCard(value)
}

/** Deck shape check: name string + valid cards */
function isValidDeck(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { name, cards } = value
  return isString(name) && name.length > 0 && Array.isArray(cards) && cards.every(isValidCard)
}

/** GameSettings shape check: valid mode/focus + levels + optional deck */
function isValidSettings(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { mode, focus, levels, deck } = value
  return (
    typeof mode === 'string' &&
    ['copy', 'hidden'].includes(mode) &&
    typeof focus === 'string' &&
    ['weak', 'medium', 'strong', 'slow'].includes(focus) &&
    Array.isArray(levels) &&
    levels.every(isValidCardLevel) &&
    (deck === undefined || isString(deck))
  )
}

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
  STORAGE_KEYS.GAME_STATE,
  isValidSettings
)

// ============================================================================
// Decks
// ============================================================================

/**
 * Load all card decks from storage
 * Invalid decks (or decks containing invalid cards) fall back to defaults
 */
export function loadDecks(): CardDeck[] {
  const stored = localStorage.getItem(STORAGE_KEYS.DECKS)
  if (stored === null || stored === '') {
    saveDecks(DEFAULT_DECKS)
    return DEFAULT_DECKS
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    const decks = Array.isArray(parsed) ? parsed.filter(isValidDeck) : []
    if (decks.length === 0) {
      saveDecks(DEFAULT_DECKS)
      return DEFAULT_DECKS
    }
    return decks as CardDeck[]
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

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY, isValidHistoryEntry)

export function loadHistory(): GameHistory[] {
  return historyOps.load()
}

export function saveHistory(history: GameHistory[]): void {
  historyOps.save(history)
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

// ============================================================================
// Settings
// ============================================================================

/**
 * Load game settings
 * @returns Validated settings or null if invalid
 */
export function loadSettings(): GameSettings | null {
  return loadJSON<GameSettings | null>(STORAGE_KEYS.SETTINGS, null, isValidSettings)
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
