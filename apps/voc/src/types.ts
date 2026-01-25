/**
 * Wordplay Vocabulary App - Type Definitions
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

export type GameMode = 'multiple-choice' | 'blind' | 'typing'
export type Direction = 'voc-de' | 'de-voc'

// Card Definition (extends BaseCard)
export interface Card extends BaseCard {
  voc: string // Used as unique key/identifier
  de: string
}

// Card Deck Definition
export interface CardDeck {
  name: string // Unique deck identifier
  cards: Card[] // Cards in this deck
}

// Game Configuration

export interface GameSettings {
  mode: GameMode
  focus: FocusType // 'weak', 'strong', or 'slow'
  language: Direction
  deck?: string // Optional deck name (for future compatibility)
}

// Game History (extends BaseGameHistory)

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
  totalCards?: number // Optional for compatibility, but should be set by finishGame
}

// Game State (extends shared GameState)

export interface GameState extends SharedGameState {
  cards: Card[] // Strongly typed with app-specific Card
}

// ============================================================================
// Points Breakdown
// ============================================================================

/**
 * Detailed breakdown of points calculation for feedback display
 */
export interface PointsBreakdown {
  levelPoints: number
  difficultyPoints: number
  pointsBeforeBonus: number
  closeAdjustment: number
  languageBonus: number
  timeBonus: number
  totalPoints: number
}
