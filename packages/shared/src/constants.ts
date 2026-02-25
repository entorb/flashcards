/**
 * Shared constants used across all flashcards apps
 */

// ============================================================================
// GAME DIFFICULTY LEVELS
// ============================================================================

/**
 * Minimum difficulty level for cards
 */
export const MIN_LEVEL = 1

/**
 * Maximum difficulty level for cards
 */

export const MAX_LEVEL = 5

// ============================================================================
// CARD TIMING
// ============================================================================

/**
 * Minimum card response time in seconds
 */
export const MIN_TIME = 0.1

/**
 * Maximum card response time in seconds (60 second cap)
 */
export const MAX_TIME = 60

// ============================================================================
// FEEDBACK TIMING
// ============================================================================

/**
 * Duration to disable buttons after wrong answer in milliseconds
 */
export const BUTTON_DISABLE_DURATION = 3000

/**
 * Countdown update interval in milliseconds
 * Used for updating countdown displays during feedback timers
 */
export const COUNTDOWN_INTERVAL = 1000

// ============================================================================
// DAILY BONUSES
// ============================================================================

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

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Color palette for card difficulty levels
 * Maps level 1-5 to hex colors: red → green
 * Used by LevelDistribution component and level visualizations
 */
export const LEVEL_COLORS: Record<number, string> = {
  1: '#ffcdd2', // red-100 - Level 1 (beginner)
  2: '#ffe0b2', // orange-100 - Level 2
  3: '#fff9c4', // yellow-100 - Level 3 (intermediate)
  4: '#dcedc8', // light-green-100 - Level 4
  5: '#c8e6c9' // green-100 - Level 5 (advanced)
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

// ============================================================================
// GAME MODES
// ============================================================================

/**
 * Number of rounds each card is repeated in 3-rounds mode
 */
export const LOOP_COUNT = 3
