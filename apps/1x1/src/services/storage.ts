/**
 * 1x1 Multiplication App - Storage Service
 * Handles localStorage operations for cards, history, stats, and game configuration
 */

/* eslint-disable sonarjs/todo-tag */

import type { GameResult, GameStats } from '@flashcards/shared'
import {
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  saveJSON,
  incrementDailyGames as sharedIncrementDailyGames
} from '@flashcards/shared'

import { MAX_CARD_TIME, MIN_CARD_LEVEL, MIN_CARD_TIME, DEFAULT_RANGE } from '@/constants'
import type { Card, GameHistory, GameSettings } from '@/types'

const STORAGE_KEYS = {
  CARDS: '1x1-cards',
  HISTORY: '1x1-history',
  STATS: '1x1-stats',
  GAME_CONFIG: '1x1-game-config',
  GAME_RESULT: '1x1-game-result',
  DAILY_STATS: '1x1-daily-stats',
  GAME_STATE: '1x1-game-state',
  RANGE: '1x1-range'
}

// Game persistence factory for session storage
interface GameState {
  gameCards: Card[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
}

const gamePersistence = createGamePersistence<GameSettings, GameState>(
  STORAGE_KEYS.GAME_CONFIG,
  STORAGE_KEYS.GAME_STATE
)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse a card question string into x and y numbers
 * @param question - Card question in format "YxX" (e.g., "3x6")
 * @returns Object with x and y numbers
 */
export function parseCardQuestion(question: string): { x: number; y: number } {
  const [y, x] = question.split('x').map(Number)
  return { x, y }
}

/**
 * Create a default card with initial level and time
 * @param y - First number (larger or equal to x)
 * @param x - Second number (smaller or equal to y)
 * @returns Card with default values
 */
export function createDefaultCard(y: number, x: number): Card {
  return {
    question: `${y}x${x}`,
    answer: x * y,
    level: MIN_CARD_LEVEL,
    time: MAX_CARD_TIME
  }
}

// ============================================================================
// CARD OPERATIONS
// ============================================================================

/**
 * Initialize all multiplication cards for the app
 * Generates cards from 3x3 to 9x9 where x <= y (avoiding duplicates)
 */
export function initializeCards(): Card[] {
  const cards: Card[] = []
  const minTable = Math.min(...DEFAULT_RANGE)
  const maxTable = Math.max(...DEFAULT_RANGE)

  for (let y = minTable; y <= maxTable; y++) {
    for (let x = minTable; x <= y; x++) {
      cards.push(createDefaultCard(y, x))
    }
  }

  saveJSON(STORAGE_KEYS.CARDS, cards)
  return cards
}

/**
 * TODO: delete after a week (10.11.2025)
 * Migrate old format cards (y <= x) to new format (x <= y)
 * Old: "3x5" where y=3, x=5, y <= x
 * New: "5x3" where y=5, x=3, x <= y
 */
function migrateCardsToNewFormat(cards: Card[]): Card[] {
  let migrated = false
  const migratedCards = cards.map(card => {
    const [first, second] = card.question.split('x').map(Number)

    // If first <= second, it's old format (y <= x), needs migration
    if (first < second) {
      migrated = true
      return {
        ...card,
        question: `${second}x${first}` // Swap to new format (x <= y)
      }
    }

    // Already in new format or square (first === second)
    return card
  })

  // Save migrated cards if any changes were made
  if (migrated) {
    console.warn('Migrated cards from old format (y <= x) to new format (x <= y)')
    saveCards(migratedCards)
  }

  return migratedCards
}

/**
 * Load all multiplication cards from storage
 * Returns empty array if no cards exist (no auto-initialization)
 * Automatically migrates old format cards to new format
 */
export function loadCards(): Card[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CARDS)
  if (!stored) {
    return []
  }
  try {
    const cards = JSON.parse(stored) as Card[]
    return migrateCardsToNewFormat(cards)
  } catch {
    console.error('Error parsing 1x1 cards from localStorage.')
    return []
  }
}

/**
 * Generate virtual cards for all possible combinations in range
 * Returns stored card if exists, otherwise creates virtual card with defaults
 */
export function getVirtualCardsForRange(range: number[]): Card[] {
  const storedCards = loadCards()
  const cardMap = new Map(storedCards.map(c => [c.question, c]))
  const virtualCards: Card[] = []

  for (const y of range) {
    for (const x of range) {
      if (x <= y) {
        const question = `${y}x${x}`
        const existingCard = cardMap.get(question)

        if (existingCard) {
          virtualCards.push(existingCard)
        } else {
          // Create virtual card with default values
          virtualCards.push(createDefaultCard(y, x))
        }
      }
    }
  }

  return virtualCards
}

/**
 * Save all cards to storage
 */
export function saveCards(cards: Card[]): void {
  saveJSON(STORAGE_KEYS.CARDS, cards)
}

/**
 * Update a specific card by question
 * Creates the card if it doesn't exist yet (lazy loading on first answer)
 * @param question - Card question (e.g., "3x4")
 * @param updates - Partial card updates
 */
export function updateCard(question: string, updates: Partial<Card>): void {
  const cards = loadCards()
  const index = cards.findIndex(c => c.question === question)

  // Clamp time within allowed range
  if (updates.time !== undefined) {
    updates.time = Math.max(MIN_CARD_TIME, Math.min(MAX_CARD_TIME, updates.time))
  }

  if (index === -1) {
    // Card doesn't exist yet, create it (lazy loading)
    const { x, y } = parseCardQuestion(question)
    const newCard = createDefaultCard(y, x)
    cards.push({
      ...newCard,
      level: updates.level ?? MIN_CARD_LEVEL,
      time: updates.time ?? MAX_CARD_TIME
    })
  } else {
    // Card exists, update it
    cards[index] = { ...cards[index], ...updates }
  }

  saveCards(cards)
}

/**
 * Reset all cards to initial state (level 1, time 60s)
 */
export function resetCards(): void {
  const cards = loadCards()
  for (const card of cards) {
    card.level = MIN_CARD_LEVEL
    card.time = MAX_CARD_TIME
  }
  saveCards(cards)
}

// Game History - Using shared operations

const historyOps = createHistoryOperations<GameHistory>(STORAGE_KEYS.HISTORY)

/**
 * Load all game history entries
 */
export function loadHistory(): GameHistory[] {
  return historyOps.load()
}

/**
 * Save all game history
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

// Statistics - Using shared operations

const statsOps = createStatsOperations<GameStats>(STORAGE_KEYS.STATS, {
  gamesPlayed: 0,
  points: 0,
  correctAnswers: 0
})

/**
 * Load overall game statistics
 */
export function loadGameStats(): GameStats {
  return statsOps.load()
}

/**
 * Save statistics
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

// Game Configuration (Session Storage)

/**
 * Save current game configuration to session storage
 */
export function setGameConfig(config: GameSettings): void {
  gamePersistence.saveSettings(config)
}

/**
 * Load game configuration from session storage
 */
export function getGameConfig(): GameSettings | null {
  return gamePersistence.loadSettings()
}

// Game Result (Session Storage)

/**
 * Save game result to session storage
 */
export function setGameResult(result: GameResult): void {
  sessionStorage.setItem(STORAGE_KEYS.GAME_RESULT, JSON.stringify(result))
}

/**
 * Load game result from session storage
 */
export function getGameResult(): GameResult | null {
  const stored = sessionStorage.getItem(STORAGE_KEYS.GAME_RESULT)
  return stored ? JSON.parse(stored) : null
}

/**
 * Clear game result from session storage
 */
export function clearGameResult(): void {
  sessionStorage.removeItem(STORAGE_KEYS.GAME_RESULT)
}

// Daily Stats

/**
 * Track daily games and detect first game of the day
 * Used for bonus points
 */
export function incrementDailyGames(): { isFirstGame: boolean; gamesPlayedToday: number } {
  return sharedIncrementDailyGames(STORAGE_KEYS.DAILY_STATS)
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
  gamePersistence.clearState()
}

// Range Configuration (for extended cards 1x2, 1x12, 1x20)
// Range is an array of unlocked numbers: [3, 4, 5, 6, 7, 8, 9] by default
// Extended features add to this: 1x2 adds 2, 1x12 adds 11-12, 1x20 adds 13-20
// Note: 10 is intentionally skipped

/**
 * Load range configuration (array of unlocked numbers)
 * Default range: [3, 4, 5, 6, 7, 8, 9] (base cards)
 */
export function loadRange(): number[] {
  const stored = localStorage.getItem(STORAGE_KEYS.RANGE)
  if (!stored) {
    return [...DEFAULT_RANGE]
  }
  try {
    return JSON.parse(stored) as number[]
  } catch {
    console.error('Error parsing range from localStorage. Using defaults.')
    return [...DEFAULT_RANGE]
  }
}

/**
 * Save range configuration
 */
export function saveRange(range: number[]): void {
  saveJSON(STORAGE_KEYS.RANGE, range)
}

/**
 * Toggle a feature by updating the range array
 * Returns the new range
 */
export function toggleFeature(
  current: number[],
  feature: 'feature1x2' | 'feature1x12' | 'feature1x20'
): number[] {
  const currentSet = new Set(current)

  if (feature === 'feature1x2') {
    // Toggle 2 in range
    if (currentSet.has(2)) {
      // Deactivate: remove 2
      return current.filter(n => n !== 2)
    } else {
      // Activate: add 2 at beginning
      return [2, ...current]
    }
  } else if (feature === 'feature1x12') {
    // Toggle 11, 12 in range
    if (currentSet.has(11) || currentSet.has(12)) {
      // Deactivate: remove 11, 12, and also remove 13-20 if present (1x20 depends on 1x12)
      return current.filter(n => n < 11)
    } else {
      // Activate: add 11, 12
      const base = current.filter(n => n < 11)
      return [...base, 11, 12]
    }
  } else if (feature === 'feature1x20') {
    // Toggle 13-20 in range (and auto-enable 1x12)
    if (currentSet.has(13)) {
      // Deactivate: remove 13-20
      return current.filter(n => n < 13)
    } else {
      // Activate: add 11-20 (auto-enables 1x12)
      const base = current.filter(n => n < 11)
      return [...base, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    }
  }

  return current
}

// Reset All

/**
 * Reset all stored data (cards, history, stats, session storage, range)
 */
export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEYS.CARDS)
  localStorage.removeItem(STORAGE_KEYS.HISTORY)
  localStorage.removeItem(STORAGE_KEYS.STATS)
  localStorage.removeItem(STORAGE_KEYS.DAILY_STATS)
  localStorage.removeItem(STORAGE_KEYS.RANGE)
  sessionStorage.removeItem(STORAGE_KEYS.GAME_RESULT)
  gamePersistence.clearAll()
}
