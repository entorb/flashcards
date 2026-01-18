/**
 * LWK App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type {
  BaseCard,
  BaseGameHistory,
  FocusType,
  GameState as SharedGameState
} from '@flashcards/shared'

// ============================================================================
// App-Specific Types
// ============================================================================

export type GameMode = 'copy' | 'hidden'

// Card Definition (extends BaseCard)
export interface Card extends BaseCard {
  word: string // The spelling word - used as unique key/identifier
  time: number // Seconds for best time in hidden mode (1-60s, default 60)
}

// Card Deck Definition
export interface CardDeck {
  name: string // Unique deck identifier ("Kiste")
  cards: Card[] // Cards in this deck
}

// Game Configuration

export interface GameSettings {
  mode: GameMode
  focus: FocusType // 'weak', 'medium', 'strong', or 'slow'
  deck?: string // Optional deck name (for future compatibility)
}

// Game History (extends BaseGameHistory)

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}

// Game State (extends shared GameState)

export interface GameState extends SharedGameState {
  settings: GameSettings
  currentCard: Card | null
  showWord: boolean // Whether word is currently visible
  countdown: number // Countdown timer for hidden mode (0-3 seconds)
}

// ============================================================================
// Storage Keys (prefixed with 'lwk-')
// ============================================================================

export const STORAGE_KEYS = {
  DECKS: 'lwk-decks',
  HISTORY: 'lwk-history',
  STATS: 'lwk-stats',
  GAME_CONFIG: 'lwk-game-config', // sessionStorage
  GAME_STATE: 'lwk-game-state', // sessionStorage
  GAME_RESULT: 'lwk-game-result', // sessionStorage
  LAST_SETTINGS: 'lwk-last-settings',
  DAILY_STATS: 'lwk-daily-stats'
} as const

// ============================================================================
// Utility Types
// ============================================================================

export type SpellingCheck = {
  isCorrect: boolean
  isCloseMatch: boolean // Only one character different
  distance: number // Levenshtein distance
}
