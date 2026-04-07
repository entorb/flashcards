/**
 * Central configuration for the div app
 */

import type { GameStateFlowConfig } from '@flashcards/shared'

export { TIME_COLOR_THRESHOLDS, TIME_COLORS } from '@flashcards/shared'

/**
 * Base path for the div app — used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-div'

// --- Storage Keys ---

/**
 * All storage keys for localStorage and sessionStorage
 * Key naming: UPPERCASE_WITH_UNDERSCORES for constant names, lowercase-with-hyphens for actual keys
 */
export const STORAGE_KEYS = {
  CARDS: 'fc-div-cards',
  HISTORY: 'fc-div-history',
  STATS: 'fc-div-stats',
  SETTINGS: 'fc-div-settings',
  GAME_CONFIG: 'fc-div-game-config',
  SELECTED_CARDS: 'fc-div-selected-cards',
  GAME_RESULT: 'fc-div-game-result',
  DAILY_STATS: 'fc-div-daily-stats',
  GAME_STATE: 'fc-div-game-state',
  RANGE: 'fc-div-range'
}

// --- Game State Flow Configuration ---

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

// --- Game Logic ---

/**
 * Default range configuration (all divisors 2-9)
 * Extended feature can add: ≤50 range via feature toggle
 */
export const DEFAULT_RANGE = [2, 3, 4, 5, 6, 7, 8, 9]

/**
 * Maximum number of cards per game
 */
export const MAX_CARDS_PER_GAME = 10

// --- Color Scheme ---

/**
 * Theme color for PWA and browser chrome
 * CRITICAL: Must also be updated in:
 * - vite.config.ts (themeColor property)
 * - index.html (meta name="theme-color" content)
 */
export const THEME_COLOR = '#DAA520'
