/**
 * Shared constants used across all flashcards apps
 */

import type { CardLevel } from './types'

/**
 * localStorage key for caching pending stats writes when offline
 */
export const STATS_PENDING_STORAGE_KEY = 'fc-stats-pending'

/**
 * Hostname for production environment, to ensure stats are only recorded in production
 */
export const PROD_HOSTNAME = 'entorb.net'

/**
 * Share app via footer URL
 */
export const SHARE_URL = 'https://entorb.net/flashcards/'

/**
 * Web stats API endpoint for reading/writing access counts
 */
export const WEB_STATS_URL = 'https://entorb.net/web-stats-json.php'

// --- Game Difficulty Levels ---

/**
 * Minimum difficulty level for cards
 */
export const MIN_LEVEL = 1

/**
 * Maximum difficulty level for cards
 */
export const MAX_LEVEL = 5

/**
 * All difficulty levels in ascending order.
 * Typed as an exact 5-tuple of CardLevel so the compiler flags any drift
 * from the CardLevel union in types.ts.
 */
export const ALL_LEVELS: readonly [CardLevel, CardLevel, CardLevel, CardLevel, CardLevel] = [
  1, 2, 3, 4, 5
]

// Validate at import time: ALL_LEVELS must match the MIN_LEVEL/MAX_LEVEL range
if (ALL_LEVELS.length !== MAX_LEVEL - MIN_LEVEL + 1 || ALL_LEVELS[0] !== MIN_LEVEL) {
  throw new Error(
    `ALL_LEVELS ${ALL_LEVELS.join(',')} does not match levels ${MIN_LEVEL}-${MAX_LEVEL}`
  )
}

// --- Card Timing ---

/**
 * Minimum card response time in seconds
 */
export const MIN_TIME = 0.1

/**
 * Maximum card response time in seconds (60 second cap)
 */
export const MAX_TIME = 60

// --- Feedback Timing ---

/**
 * Duration to disable buttons after wrong answer in milliseconds
 */
export const BUTTON_DISABLE_DURATION = 3000

/**
 * Countdown update interval in milliseconds
 * Used for updating countdown displays during feedback timers
 */
export const COUNTDOWN_INTERVAL = 1000

// --- Daily Bonuses ---

/**
 * Bonus points for the first game of the day
 */
export const FIRST_GAME_BONUS = 5

/**
 * Bonus points awarded every Nth game of the day
 */
export const STREAK_GAME_BONUS = 5

/**
 * Award streak bonus every N games played in a day
 */
export const STREAK_GAME_INTERVAL = 5

/**
 * Speed bonus points when beating previous time
 */
export const SPEED_BONUS_POINTS = 5

/**
 * Close match scoring percentage (for 1 character difference)
 */
export const CLOSE_MATCH_SCORE_PERCENTAGE = 0.75

// --- Color Palette ---

/**
 * Color palette for card difficulty levels
 * Maps level 1-5 to hex colors: red → green
 * Used by LevelDistribution component and level visualizations
 */
export const LEVEL_COLORS: Record<number, string> = {
  1: '#ef9a9a', // red-200 - Level 1 (weak)
  2: '#ffcc80', // orange-200 - Level 2
  3: '#fff59d', // yellow-200 - Level 3 (intermediate)
  4: '#c5e1a5', // light-green-200 - Level 4
  5: '#a5d6a7' // green-200 - Level 5 (strong)
}

// Validate at import time: LEVEL_COLORS must cover every level
for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
  if (LEVEL_COLORS[level] === undefined) {
    throw new Error(`LEVEL_COLORS is missing color for level ${level}`)
  }
}

/**
 * Background colors
 */
export const BG_COLORS = {
  disabled: '#f5f5f5',
  grey: '#fafafa',
  lightGrey: '#f8f9fa'
}

// --- Time Histogram ---

/**
 * Upper bounds (seconds) of the answer-time histogram buckets shown on CardsManPage.
 * Buckets: <5s, <10s, <15s, <20s, >=20s — each excludes the previous one.
 * Cards with time = MAX_TIME (never answered correctly) fall into the last bucket.
 */
export const TIME_BUCKET_BOUNDS: readonly number[] = [5, 10, 15, 20]

// --- Game Modes ---

/**
 * Number of rounds each card is repeated in 3-rounds mode
 */
export const LOOP_COUNT = 3
