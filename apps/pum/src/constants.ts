/**
 * Central configuration for the pum app
 */

import type { GameStateFlowConfig } from '@flashcards/shared'
import type { Difficulty, Operation } from './types'

export { TIME_COLOR_THRESHOLDS, TIME_COLORS } from '@flashcards/shared'

/**
 * Base path for the pum app — used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-pum'

// --- Storage Keys ---

/**
 * All storage keys for localStorage and sessionStorage
 * Key naming: UPPERCASE_WITH_UNDERSCORES for constant names, lowercase-with-hyphens for actual keys
 */
export const STORAGE_KEYS = {
  CARDS: 'fc-pum-cards',
  HISTORY: 'fc-pum-history',
  STATS: 'fc-pum-stats',
  SETTINGS: 'fc-pum-settings',
  GAME_CONFIG: 'fc-pum-game-config',
  SELECTED_CARDS: 'fc-pum-selected-cards',
  GAME_RESULT: 'fc-pum-game-result',
  DAILY_STATS: 'fc-pum-daily-stats',
  GAME_STATE: 'fc-pum-game-state',
  RANGE: 'fc-pum-range'
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
export const THEME_COLOR = '#607D8B'

// --- Default Settings ---

/**
 * Default operations — all operations selected
 */
export const DEFAULT_OPERATIONS: Operation[] = ['plus', 'minus']

/**
 * Default difficulties — all difficulties selected
 */
export const DEFAULT_DIFFICULTIES: Difficulty[] = ['simple', 'medium', 'advanced']
