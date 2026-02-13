/**
 * Central configuration file for 1x1 Learning App
 * All magic numbers and reusable constants are defined here
 */

import type { GameStateFlowConfig } from '@flashcards/shared'

export const BASE_PATH = 'fc-1x1'

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * All storage keys for localStorage and sessionStorage
 * Key naming: UPPERCASE_WITH_UNDERSCORES for constant names, lowercase-with-hyphens for actual keys
 */
export const STORAGE_KEYS = {
  CARDS: 'fc-1x1-cards',
  HISTORY: 'fc-1x1-history',
  STATS: 'fc-1x1-stats',
  SETTINGS: 'fc-1x1-settings',
  GAME_CONFIG: 'fc-1x1-game-config',
  SELECTED_CARDS: 'fc-1x1-selected-cards',
  GAME_RESULT: 'fc-1x1-game-result',
  DAILY_STATS: 'fc-1x1-daily-stats',
  GAME_STATE: 'fc-1x1-game-state',
  RANGE: 'fc-1x1-range'
}

// ============================================================================
// GAME STATE FLOW CONFIGURATION
// ============================================================================

/**
 * Centralized game state flow configuration for shared game store
 * References the STORAGE_KEYS for consistency
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: STORAGE_KEYS.SETTINGS,
  selectedCardsKey: STORAGE_KEYS.SELECTED_CARDS,
  gameResultKey: STORAGE_KEYS.GAME_RESULT,
  historyKey: STORAGE_KEYS.HISTORY,
  statsKey: STORAGE_KEYS.STATS,
  dailyStatsKey: STORAGE_KEYS.DAILY_STATS
}

// ============================================================================
// GAME LOGIC CONSTANTS
// ============================================================================

/**
 * Default range configuration (base multiplication tables)
 * Extended features can add: 2, 11-12, 13-20 via feature toggles
 * Note: 10 is intentionally skipped
 */
export const DEFAULT_RANGE = [3, 4, 5, 6, 7, 8, 9]

/**
 * Maximum number of cards per game
 */
export const MAX_CARDS_PER_GAME = 10

// ============================================================================
// COLOR SCHEMES
// ============================================================================

/**
 * Theme color for PWA and browser chrome
 * CRITICAL: Must also be updated in:
 * - vite.config.ts (themeColor property)
 * - index.html (meta name="theme-color" content)
 */
export const THEME_COLOR = '#8B6F47'

/**
 * CardsPage: Time colors (from green=fast to red=slow)
 */
export const TIME_COLORS = {
  veryFast: '#2e7d32', // green-800
  fast: '#558b2f', // light-green-800
  medium: '#f57f17', // yellow-800
  slow: '#e65100', // orange-900
  verySlow: '#c62828' // red-800
}

/**
 * CardsPage: Thresholds for time color transitions (normalized 0-1)
 */
export const TIME_COLOR_THRESHOLDS = {
  veryFast: 0.2,
  fast: 0.4,
  medium: 0.6,
  slow: 0.8
}
