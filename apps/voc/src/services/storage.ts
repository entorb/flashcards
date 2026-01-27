/**
 * Wordplay Vocabulary App - Storage Service
 * Handles localStorage operations for cards, history, settings, and stats
 */

import type { GameResult, GameStats } from '@flashcards/shared'
import {
  createAppGameStorage,
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  loadJSON,
  MAX_TIME,
  saveJSON
} from '@flashcards/shared'

import { INITIAL_CARDS } from '../constants'
import type { Card, CardDeck, GameHistory, GameSettings } from '../types'

const STORAGE_KEYS = {
  CARDS: 'voc-cards',
  HISTORY: 'voc-history',
  SETTINGS: 'voc-settings',
  STATS: 'voc-stats',
  DAILY_STATS: 'voc-daily-stats',
  GAME_STATE: 'voc-game-state',
  GAME_SETTINGS: 'voc-game-settings',
  GAME_RESULT: 'voc-game-result'
}

// Game persistence factory for session storage
interface GameState {
  gameCards: Card[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
}

const gamePersistence = createGamePersistence<GameSettings, GameState>(
  STORAGE_KEYS.GAME_SETTINGS,
  STORAGE_KEYS.GAME_STATE
)

// Decks

function migrateToDecks(data: unknown): CardDeck[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [{ name: 'en', cards: INITIAL_CARDS }]
  }

  // Check if it's already deck structure
  const firstItem = data[0] as Record<string, unknown>
  if ('name' in firstItem && 'cards' in firstItem) {
    // Migrate cards within decks
    const decks = (data as CardDeck[]).map(deck => ({
      ...deck,
      cards: deck.cards.map(card => migrateCardTimeFields(card))
    }))
    return decks
  }

  // Otherwise treat as new card structure
  const cards = (data as Card[]).map(card => migrateCardTimeFields(card))
  return [{ name: 'en', cards }]
}

// TODO: Remove this migration function 28.02.2026
function migrateCardTimeFields(card: unknown): Card {
  const cardRecord = card as Record<string, unknown>

  // If card already has time field, remove old fields
  if ('time' in cardRecord && typeof cardRecord.time === 'number') {
    const cleanCard = { ...cardRecord }
    delete cleanCard.time_blind
    delete cleanCard.time_typing
    return cleanCard as unknown as Card
  }

  // Use time_typing if it exists (typing mode was more advanced), otherwise time_blind, otherwise default
  let timeValue: number
  if (typeof cardRecord.time_typing === 'number') {
    timeValue = cardRecord.time_typing
  } else if (typeof cardRecord.time_blind === 'number') {
    timeValue = cardRecord.time_blind
  } else {
    timeValue = MAX_TIME
  }

  const cleanCard = { ...cardRecord }
  delete cleanCard.time_blind
  delete cleanCard.time_typing
  return { ...cleanCard, time: timeValue } as unknown as Card
}

/**
 * Load all card decks from storage
 */
export function loadDecks(): CardDeck[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CARDS)
  if (!stored) {
    const defaultDecks = [{ name: 'en', cards: INITIAL_CARDS }]
    saveDecks(defaultDecks)
    return defaultDecks
  }
  try {
    const parsed = JSON.parse(stored)
    const decks = migrateToDecks(parsed)
    // Save migrated data back to storage
    if (stored !== JSON.stringify(decks)) {
      saveDecks(decks)
    }
    return decks
  } catch {
    const defaultDecks = [{ name: 'en', cards: INITIAL_CARDS }]
    saveDecks(defaultDecks)
    return defaultDecks
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
  return settings?.deck || 'en'
}

// Cards (for backward compatibility - operates on current deck)

/**
 * Load flashcards from current deck
 */
export function loadCards(): Card[] {
  const decks = loadDecks()
  const deckName = getCurrentDeckName()
  const deck = decks.find(d => d.name === deckName)
  return deck ? deck.cards : decks[0].cards
}

/**
 * Save flashcards to current deck
 */
export function saveCards(cards: Card[]): void {
  const decks = loadDecks()
  const deckName = getCurrentDeckName()
  const deckIndex = decks.findIndex(d => d.name === deckName)

  if (deckIndex >= 0) {
    decks[deckIndex].cards = cards
    saveDecks(decks)
  } else {
    // Deck not found, log an error and do not save to prevent data corruption.
    console.error(`Attempted to save cards to a non-existent deck: "${deckName}". Aborting.`)
  }
}

// History - Using shared operations

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY)

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

/**
 * Add a single game entry to history
 */
export function addHistory(history: GameHistory): void {
  historyOps.add(history)
}

// Settings

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

/**
 * Update statistics after a game
 */
export function updateStatistics(points: number, correctAnswers: number): void {
  statsOps.update(points, correctAnswers)
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

// Game Settings (for reload recovery)

/**
 * Save current game settings to session storage for reload recovery
 */
export function saveGameSettings(settings: GameSettings): void {
  gamePersistence.saveSettings(settings)
}

/**
 * Load game settings from session storage
 */
export function loadGameSettings(): GameSettings | null {
  return gamePersistence.loadSettings()
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

// Reset All

/**
 * Reset all stored data (cards, history, settings, stats, daily stats)
 */
export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEYS.CARDS)
  localStorage.removeItem(STORAGE_KEYS.HISTORY)
  localStorage.removeItem(STORAGE_KEYS.SETTINGS)
  localStorage.removeItem(STORAGE_KEYS.STATS)
  localStorage.removeItem(STORAGE_KEYS.DAILY_STATS)
  gamePersistence.clearAll()
}
