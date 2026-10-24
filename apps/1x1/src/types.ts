/**
 * 1x1 Multiplication App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type { BaseCard, BaseGameHistory, BaseGameSettings } from "@flashcards/shared"

// ============================================================================
// App-Specific Types
// ============================================================================

/**
 * Selection type for multiplication tables
 * 'x²' only appears in history entries saved before squares became a separate toggle
 */
export type SelectionType = number[] | "all" | "x²"

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

export interface GameSettings extends BaseGameSettings {
  select: SelectionType // Array of numbers 3-9, e.g. [3, 5, 7], or 'all'
  squares?: boolean // Include x² cards in addition to the selected tables
}

// ============================================================================
// Game History (extends BaseGameHistory)
// ============================================================================

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}
