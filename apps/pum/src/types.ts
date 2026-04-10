/**
 * PlusMinus App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type {
  BaseCard,
  BaseGameHistory,
  FocusType,
  GameState as SharedGameState
} from '@flashcards/shared'

// ============================================================================
// Operations and Difficulties
// ============================================================================

export type Operation = 'plus' | 'minus'
export type Difficulty = 'simple' | 'medium' | 'advanced'

// ============================================================================
// Card Definition (extends BaseCard)
// ============================================================================

export interface Card extends BaseCard {
  question: string // Format: "X+Y" or "X-Y" e.g. "7+3" or "15-8"
  answer: number // e.g. 10 (7+3) or 7 (15-8)
}

// ============================================================================
// Game Configuration
// ============================================================================

export interface GameSettings {
  operations: Operation[] // ['plus'] or ['minus'] or ['plus', 'minus']
  difficulties: Difficulty[] // ['simple'] or ['simple', 'medium'] etc.
  focus: FocusType // 'weak', 'medium', 'strong', or 'slow'
}

// ============================================================================
// Game History (extends BaseGameHistory)
// ============================================================================

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}

// ============================================================================
// Game State (extends shared GameState)
// ============================================================================

export interface GameState extends SharedGameState {
  cards: Card[] // Strongly typed with app-specific Card
}
