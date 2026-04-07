/**
 * Division App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type {
  BaseCard,
  BaseGameHistory,
  FocusType,
  GameState as SharedGameState
} from '@flashcards/shared'

// ============================================================================
// Card Definition (extends BaseCard)
// ============================================================================

export interface Card extends BaseCard {
  question: string // Format: "Z:D" e.g. "18:3" (dividend:divisor)
  answer: number // e.g. 6 (18 ÷ 3 = 6)
}

// ============================================================================
// Game Configuration
// ============================================================================

export interface GameSettings {
  select: number[] // Selected divisors from 2-9, e.g. [2, 3, 5] — always number[], no 'all' or 'x²'
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
