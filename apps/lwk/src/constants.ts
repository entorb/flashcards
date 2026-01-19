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
 * Base path for routing and storage
 * CRITICAL: Must be hardcoded separately in vite.config.ts (ESM issue)
 */
export const BASE_PATH = 'fc-lwk'

/**
 * Maximum number of cards per game
 */
export const MAX_CARDS_PER_GAME = 10

/**
 * Word display duration in hidden mode (seconds)
 */
export const WORD_DISPLAY_DURATION = 3

/**
 * Close match scoring percentage (for 1 character difference)
 */
export const CLOSE_MATCH_SCORE_PERCENTAGE = 0.75

export const DEFAULT_DECKS = [
  {
    name: 'Lernwörter_1',
    cards: [
      { word: 'Haus', level: 1, time: 60 },
      { word: 'Schule', level: 1, time: 60 },
      { word: 'Wald', level: 1, time: 60 },
      { word: 'Mathe', level: 1, time: 60 },
      { word: 'Deutsch', level: 1, time: 60 },
      { word: 'Sport', level: 1, time: 60 },
      { word: 'Musik', level: 1, time: 60 }
    ] as Card[]
  }
]
