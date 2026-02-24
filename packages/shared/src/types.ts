/**
 * Shared Types for Flashcards Monorepo
 * Contains common interfaces used across both 1x1 and Wordplay apps
 */

/**
 * Base GameHistory interface
 * All game history entries must include these core fields
 */
export interface BaseGameHistory {
  date: string // ISO date string (YYYY-MM-DD or full ISO)
  points: number // Points earned in this game
  correctAnswers: number // Number of correct answers
}

/**
 * Base Card interface
 * Apps may extend with additional fields
 */
export interface BaseCard {
  level: number // 1-5
  time: number // Seconds for last correct answer (0.1-60s, default 60)
}

/**
 * Common FocusType for all apps
 * Represents learning focus strategy
 */
export type FocusType = 'weak' | 'medium' | 'strong' | 'slow'

/**
 * Common AnswerStatus for all apps
 * Result of evaluating a user's answer
 */
export type AnswerStatus = 'correct' | 'incorrect' | 'close'

/**
 * Game statistics interface
 * Can be extended with additional fields by specific apps
 */
export interface GameStats {
  correctAnswers: number
  gamesPlayed: number
  points: number
}

/**
 * Game result for game over page interface
 */
export interface GameResult {
  points: number
  correctAnswers: number
  totalCards: number
}

/**
 * Game state during gameplay (shared across all apps)
 * Runtime state tracking
 */
export interface GameState<T = BaseCard> {
  cards: T[] // Array of cards; apps should specify their Card type, defaulting to BaseCard
  currentCardIndex: number
  points: number
  correctAnswers: number
  startTime: number // timestamp
}

/**
 * Daily bonus tracking
 */
export interface DailyStats {
  date: string // ISO date string (YYYY-MM-DD)
  gamesPlayed: number
}

/**
 * Daily games increment result
 */
export interface DailyGamesResult {
  isFirstGame: boolean
  gamesPlayedToday: number
}

/**
 * Configuration for daily game bonuses
 */
export interface DailyBonusConfig {
  firstGameBonus: number
  streakGameBonus: number
  streakGameInterval: number
}

/**
 * Session mode for game sessions
 * Named SessionMode to avoid collision with app-specific GameMode types
 * (voc: 'multiple-choice' | 'blind' | 'typing', lwk: 'copy' | 'hidden')
 */
export type SessionMode = 'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'
