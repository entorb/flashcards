/**
 * Central configuration file for 1x1 Learning App
 * All magic numbers and reusable constants are defined here
 */

import type { GameStateFlowConfig } from '@flashcards/shared'

export const BASE_PATH = 'fc-1x1'

// ============================================================================
// GAME STATE FLOW CONFIGURATION
// ============================================================================

/**
 * Centralized game state flow configuration
 * Keys for localStorage and sessionStorage used throughout the game lifecycle
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: '1x1-settings',
  selectedCardsKey: '1x1-selected-cards',
  gameResultKey: '1x1-game-result',
  historyKey: '1x1-history',
  statsKey: '1x1-stats',
  dailyStatsKey: '1x1-daily-stats'
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
