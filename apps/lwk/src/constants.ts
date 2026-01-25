import type { GameStateFlowConfig } from '@flashcards/shared'

import type { Card } from './types'

/**
 * Base path for routing and storage
 * CRITICAL: Must be hardcoded separately in vite.config.ts (ESM issue)
 */
export const BASE_PATH = 'fc-lwk'

// ============================================================================
// GAME STATE FLOW CONFIGURATION
// ============================================================================

/**
 * Centralized game state flow configuration
 * Keys for localStorage and sessionStorage used throughout the game lifecycle
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: 'lwk-settings',
  selectedCardsKey: 'lwk-selected-cards',
  gameResultKey: 'lwk-game-result',
  historyKey: 'lwk-history',
  statsKey: 'lwk-stats',
  dailyStatsKey: 'lwk-daily-stats'
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
