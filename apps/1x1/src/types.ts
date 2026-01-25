/**
 * 1x1 Multiplication App - Type Definitions
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

/** Selection type for multiplication tables */
export type SelectionType = number[] | 'all' | 'x²'

// ============================================================================
// Card Definition (extends BaseCard)
// ============================================================================

export interface Card extends BaseCard {
  question: string // Format: "XxY" e.g. "3x4"
  answer: number // e.g. 12
}

// ============================================================================
// Game Configuration
// ============================================================================

export interface GameSettings {
  select: SelectionType // Array of numbers 3-9, e.g. [3, 5, 7], or 'all', or 'x²'
  focus: FocusType // 'weak', 'strong', or 'slow'
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

// ============================================================================
// Answer Data (GamePage)
// ============================================================================

/**
 * Data used in GamePage after answer submission
 * Contains answer correctness, points breakdown, and timing information
 */
export interface AnswerData {
  isCorrect: boolean
  userAnswer: number
  basePoints: number
  levelBonus: number
  speedBonus: number
  totalPoints: number
  timeTaken: number
}
