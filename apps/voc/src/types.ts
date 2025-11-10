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
export type Language = 'en-de' | 'de-en'

// Card Definition (extends BaseCard)
export interface Card extends BaseCard {
  en: string // Used as unique key/identifier
  de: string
  time_blind: number // Seconds for last correct answer in blind mode (0.1-60s, default 60)
  time_typing: number // Seconds for last correct answer in typing mode (0.1-60s, default 60)
}

// Game Configuration

export interface GameSettings {
  mode: GameMode
  focus: FocusType // 'weak', 'strong', or 'slow'
  language: Language
}

// Game History (extends BaseGameHistory)

export interface GameHistory extends BaseGameHistory {
  settings: GameSettings
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
  basePoints: number
  modeMultiplier: number
  pointsBeforeBonus: number
  closeAdjustment: number
  languageBonus: number
  timeBonus: number
  totalPoints: number
}

// ============================================================================
// Answer Data (FlashCard component)
// ============================================================================

/**
 * Data emitted from FlashCard component after answer submission
 * Contains result, timing, and complete points breakdown
 */
export interface AnswerData {
  result: 'correct' | 'incorrect' | 'close'
  answerTime: number
  earnedPoints: number
  pointsBreakdown: PointsBreakdown
}
