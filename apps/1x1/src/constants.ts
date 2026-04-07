/**
 * Central configuration for the 1x1 app
 */

import type { GameStateFlowConfig } from '@flashcards/shared'

/**
 * Base path for the 1x1 app — used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-1x1'

// --- Storage Keys ---

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
 * Default range configuration (base multiplication tables)
 * Extended features can add: 2, 11-12, 13-20 via feature toggles
 * Note: 10 is intentionally skipped
 */
export const DEFAULT_RANGE = [3, 4, 5, 6, 7, 8, 9]

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
export const THEME_COLOR = '#8B6F47'
