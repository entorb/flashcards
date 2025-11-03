import type { Card } from './types'

/**
 * Re-export shared constants
 */
export {
  MIN_LEVEL,
  MAX_LEVEL,
  MIN_TIME,
  MAX_TIME,
  DEFAULT_TIME,
  AUTO_CLOSE_DURATION,
  BUTTON_DISABLE_DURATION,
  FIRST_GAME_BONUS,
  STREAK_GAME_BONUS,
  STREAK_GAME_INTERVAL,
  SPEED_BONUS_POINTS,
  LEVEL_BONUS_NUMERATOR
} from '@flashcards/shared'

/**
 * Base path for the Wordplay app - used in routing, PWA config, and database
 */
export const BASE_PATH = 'voc'

export const ROUND_SIZE = 10

// ============================================================================
// GAME SCORING
// ============================================================================

/**
 * Point multiplier for multiple-choice mode (base difficulty)
 */

/**
 * Point multiplier for blind mode (medium difficulty)
 */
export const MODE_MULTIPLIER_BLIND = 2

/**
 * Point multiplier for typing mode (high difficulty)
 */
export const MODE_MULTIPLIER_TYPING = 4

/**
 * Points earned for closing answer with typos in typing mode (75% of base)
 */
export const CLOSE_ANSWER_PENALTY = 0.75

/**
 * Bonus points for answering in DE→EN direction (increased difficulty)
 */
export const LANGUAGE_BONUS_DE_EN = 1

export const INITIAL_CARDS: Card[] = [
  { en: 'Where', de: 'Wo', level: 1, time_blind: 60, time_typing: 60 },
  { en: 'Who', de: 'Wer', level: 1, time_blind: 60, time_typing: 60 },
  { en: 'What', de: 'Was', level: 2, time_blind: 60, time_typing: 60 },
  { en: 'Why', de: 'Warum', level: 2, time_blind: 60, time_typing: 60 },
  { en: 'When', de: 'Wann', level: 3, time_blind: 60, time_typing: 60 },
  { en: 'How', de: 'Wie', level: 3, time_blind: 60, time_typing: 60 },
  { en: 'Which', de: 'Welche/Welcher/Welches', level: 4, time_blind: 60, time_typing: 60 },
  { en: 'From where', de: 'Woher', level: 4, time_blind: 60, time_typing: 60 },
  { en: 'To where', de: 'Wohin', level: 5, time_blind: 60, time_typing: 60 },
  { en: 'How much', de: 'Wie viel', level: 5, time_blind: 60, time_typing: 60 }
]

/**
 * Levenshtein distance threshold for accepting "close" answers
 * Distance of 2 means up to 2 character changes are tolerated
 */
export const LEVENSHTEIN_THRESHOLD = 2

/**
 * Database column name for web stats tracking - derived from BASE_PATH
 */
export const STATS_DB_COL = BASE_PATH
