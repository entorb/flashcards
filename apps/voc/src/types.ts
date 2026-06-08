/**
 * Wordplay Vocabulary App - Type Definitions
 * Extends shared types from @flashcards/shared with app-specific types
 */

import type { BaseCard, BaseGameHistory, FocusType } from '@flashcards/shared'

// ============================================================================
// App-Specific Types
// ============================================================================

type GameMode = 'multiple-choice' | 'blind' | 'typing'
type Direction = 'voc-de' | 'de-voc'

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
  focus: FocusType // 'weak', 'medium', 'strong', or 'slow'
  language: Direction
  deck?: string // Optional deck name (for future compatibility)
}

// Game History (extends BaseGameHistory)

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
  totalCards?: number // Optional for compatibility, but should be set by finishGame
}
