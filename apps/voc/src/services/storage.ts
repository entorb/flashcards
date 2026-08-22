/**
 * Wordplay Vocabulary App - Storage Service
 * Handles localStorage operations for cards, history, settings, and stats
 */

import type { GameResult, GameStats, SessionMode } from '@flashcards/shared'
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
  isValidBaseSettings,
  isValidHistoryEntry
} from '@flashcards/shared/utils'

import { DEFAULT_DECKS, STORAGE_KEYS } from '../constants'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'

/** Card shape check: voc/de strings + valid BaseCard level/time */
function isValidCard(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { voc, de } = value
  return isString(voc) && voc.length > 0 && isString(de) && de.length > 0 && isValidBaseCard(value)
}

/** Deck shape check: name string + cards array */
function isValidDeck(value: unknown): value is CardDeck {
  if (!isRecord(value)) return false
  const { name, cards } = value
  return isString(name) && name.length > 0 && Array.isArray(cards) && cards.every(isValidCard)
}

/** GameSettings shape check: base fields + mode/language literals + optional deck */
function isValidSettings(value: unknown): boolean {
  if (!(isValidBaseSettings(value) && isRecord(value))) return false
  const { mode, language, deck } = value
  return (
    typeof mode === 'string' &&
    ['multiple-choice', 'blind', 'typing'].includes(mode) &&
    typeof language === 'string' &&
    ['voc-de', 'de-voc'].includes(language) &&
    (deck === undefined || isString(deck))
  )
}

// Game persistence factory for session storage
interface GameState {
  gameCards: Card[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
  gameSettings: GameSettings
  sessionMode?: SessionMode
  initialCardCount?: number
}

const gamePersistence = createGamePersistence<GameSettings, GameState>(
  STORAGE_KEYS.GAME_SETTINGS,
  STORAGE_KEYS.GAME_STATE,
  isValidSettings
)

/**
 * Load all card decks from storage
 * Invalid decks or cards are dropped silently
 */
export function loadDecks(): CardDeck[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CARDS)
  if (stored === null) {
    saveDecks(DEFAULT_DECKS)
    return DEFAULT_DECKS
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      saveDecks(DEFAULT_DECKS)
      return DEFAULT_DECKS
    }
    const decks = parsed.filter(isValidDeck)
    if (decks.length === 0) {
      saveDecks(DEFAULT_DECKS)
      return DEFAULT_DECKS
    }
    // Save back only when invalid decks were dropped
    if (decks.length !== parsed.length) {
      saveDecks(decks)
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
  saveJSON(STORAGE_KEYS.CARDS, decks)
}

/**
 * Get current deck name from settings
 */
export function getCurrentDeckName(): string {
  const settings = loadSettings()
  return settings?.deck ?? 'en'
}

// Cards (for backward compatibility - operates on current deck)

/**
 * Load flashcards from current deck
 */
export function loadCards(): Card[] {
  const decks = loadDecks()
  const deckName = getCurrentDeckName()
  const deck = decks.find(d => d.name === deckName) ?? decks[0]
  return deck?.cards ?? []
}

/**
 * Save flashcards to current deck
 */
export function saveCards(cards: Card[]): void {
  const decks = loadDecks()
  const deckName = getCurrentDeckName()
  const deckIndex = decks.findIndex(d => d.name === deckName)

  if (deckIndex >= 0) {
    const deck = decks[deckIndex]
    if (deck) {
      deck.cards = cards
      saveDecks(decks)
    }
  } else {
    // Deck not found, log an error and do not save to prevent data corruption.
    console.error(`Attempted to save cards to a non-existent deck: "${deckName}". Aborting.`)
  }
}

// History - Using shared operations

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY, isValidHistoryEntry)

/**
 * Load game history
 */
export function loadHistory(): GameHistory[] {
  return historyOps.load()
}

/**
 * Save game history
 */
export function saveHistory(history: GameHistory[]): void {
  historyOps.save(history)
}

// Settings

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

// Stats - Using shared operations

const statsOps = createStatsOperations<GameStats>(STORAGE_KEYS.STATS, {
  points: 0,
  correctAnswers: 0,
  gamesPlayed: 0
})

/**
 * Load game statistics
 */
export function loadGameStats(): GameStats {
  return statsOps.load()
}

/**
 * Save game statistics
 */
export function saveGameStats(stats: GameStats): void {
  statsOps.save(stats)
}

// Game Storage Factory - Consolidates result/state/daily operations

const gameStorage = createAppGameStorage(
  STORAGE_KEYS.GAME_RESULT,
  STORAGE_KEYS.GAME_STATE,
  STORAGE_KEYS.DAILY_STATS
)

// Daily Stats

/**
 * Track daily games and detect first game of the day
 * Used for bonus points
 */
export function incrementDailyGames(): { isFirstGame: boolean; gamesPlayedToday: number } {
  return gameStorage.incrementDailyGames()
}

// Game State (for reload recovery)

/**
 * Save current game state to session storage for reload recovery
 */
export function saveGameState(state: GameState): void {
  gamePersistence.saveState(state)
}

/**
 * Load game state from session storage
 */
export function loadGameState(): GameState | null {
  return gamePersistence.loadState()
}

/**
 * Clear game state from session storage
 */
export function clearGameState(): void {
  gameStorage.clearGameState()
}

// Game Result (Session Storage)

/**
 * Save game result to session storage
 */
export function setGameResult(result: GameResult): void {
  gameStorage.setGameResult(result)
}

/**
 * Load game result from session storage
 */
export function getGameResult(): GameResult | null {
  return gameStorage.getGameResult()
}

/**
 * Clear game result from session storage
 */
export function clearGameResult(): void {
  gameStorage.clearGameResult()
}
