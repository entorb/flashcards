import type { GameStateFlowConfig } from '@flashcards/shared'

import type { Card } from './types'

/**
 * Base path for routing and storage
 * CRITICAL: Must be hardcoded separately in vite.config.ts (ESM issue)
 */
export const BASE_PATH = 'fc-lwk'

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * All storage keys for localStorage and sessionStorage
 * Key naming: UPPERCASE_WITH_UNDERSCORES for constant names, lowercase-with-hyphens for actual keys
 */
export const STORAGE_KEYS = {
  DECKS: 'fc-lwk-decks',
  HISTORY: 'fc-lwk-history',
  STATS: 'fc-lwk-stats',
  GAME_CONFIG: 'fc-lwk-game-config',
  GAME_STATE: 'fc-lwk-game-state',
  GAME_RESULT: 'fc-lwk-game-result',
  GAME_SETTINGS: 'fc-lwk-settings',
  DAILY_STATS: 'fc-lwk-daily-stats'
}

// ============================================================================
// GAME STATE FLOW CONFIGURATION
// ============================================================================

/**
 * Centralized game state flow configuration for shared game store
 * References the STORAGE_KEYS for consistency
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: STORAGE_KEYS.GAME_SETTINGS,
  selectedCardsKey: STORAGE_KEYS.GAME_CONFIG,
  gameResultKey: STORAGE_KEYS.GAME_RESULT,
  historyKey: STORAGE_KEYS.HISTORY,
  statsKey: STORAGE_KEYS.STATS,
  dailyStatsKey: STORAGE_KEYS.DAILY_STATS
}

/**
 * Maximum number of cards per game
 */
export const MAX_CARDS_PER_GAME = 10

/**
 * Word display duration in hidden mode (seconds)
 */
export const WORD_DISPLAY_DURATION = 3

/**
 * Points for hidden mode
 */
export const POINTS_MODE_HIDDEN = 4

/**
 * Levenshtein distance threshold for close match detection
 */
export const LEVENSHTEIN_THRESHOLD = 1

export const DEFAULT_DECKS = [
  {
    name: 'Lernwörter_1',
    //cspell:disable
    cards: [
      { word: 'Dienstag', level: 1, time: 60 },
      { word: 'Donnerstag', level: 1, time: 60 },
      { word: 'fahren', level: 1, time: 60 },
      { word: 'frieren', level: 1, time: 60 },
      { word: 'Frühling', level: 1, time: 60 },
      { word: 'Mittwoch', level: 1, time: 60 },
      { word: 'Sommer', level: 1, time: 60 },
      { word: 'Sonntag', level: 1, time: 60 },
      { word: 'spielen', level: 1, time: 60 },
      { word: 'Winter', level: 1, time: 60 }
      //cspell:enable
    ] as Card[]
  }
]
