/**
 * LWK App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type { BaseCard, BaseGameHistory, FocusType } from '@flashcards/shared'

// ============================================================================
// App-Specific Types
// ============================================================================

export type GameMode = 'copy' | 'hidden'

// Card Definition (extends BaseCard)
export interface Card extends BaseCard {
  word: string // The spelling word - used as unique key/identifier
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
  totalCards?: number
}
