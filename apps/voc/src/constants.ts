/**
 * Central configuration for the voc app
 */

import type { GameStateFlowConfig } from '@flashcards/shared'

import type { Card } from './types'

/**
 * Base path for the voc app — used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-voc'

// --- Storage Keys ---

/**
 * All storage keys for localStorage and sessionStorage
 * Key naming: UPPERCASE_WITH_UNDERSCORES for constant names, lowercase-with-hyphens for actual keys
 */
export const STORAGE_KEYS = {
  CARDS: 'fc-voc-cards',
  HISTORY: 'fc-voc-history',
  SETTINGS: 'fc-voc-settings',
  STATS: 'fc-voc-stats',
  DAILY_STATS: 'fc-voc-daily-stats',
  GAME_STATE: 'fc-voc-game-state',
  GAME_SETTINGS: 'fc-voc-game-settings',
  GAME_RESULT: 'fc-voc-game-result'
}

// --- Game State Flow Configuration ---

/**
 * Centralized game state flow configuration for shared game store
 * References the STORAGE_KEYS for consistency
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: STORAGE_KEYS.SETTINGS,
  selectedCardsKey: STORAGE_KEYS.GAME_SETTINGS,
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

/**
 * Levenshtein distance threshold for accepting "close" answers
 * Distance of 2 means up to 2 character changes are tolerated
 */
export const LEVENSHTEIN_THRESHOLD = 2

// --- Color Scheme ---

/**
 * Theme color for PWA and browser chrome
 * CRITICAL: Must also be updated in:
 * - vite.config.ts (themeColor property)
 * - index.html (meta name="theme-color" content)
 */
export const THEME_COLOR = '#f97316'

// --- Game Scoring ---

/**
 * Points for blind mode (medium difficulty)
 */
export const POINTS_MODE_BLIND = 4

/**
 * Points for typing mode (high difficulty)
 */
export const POINTS_MODE_TYPING = 8

/**
 * Bonus points for answering in DE→Voc direction (increased difficulty)
 */
export const LANGUAGE_BONUS_DE_VOC = 1

// --- Default Data ---

/**
 * Initial cards for new users
 */
export const INITIAL_CARDS: Card[] = [
  { voc: 'Where', de: 'Wo', level: 1, time: 60 },
  { voc: 'Who', de: 'Wer', level: 1, time: 60 },
  { voc: 'What', de: 'Was', level: 2, time: 60 },
  { voc: 'Why', de: 'Warum', level: 2, time: 60 },
  { voc: 'When', de: 'Wann', level: 3, time: 60 },
  { voc: 'How', de: 'Wie', level: 3, time: 60 },
  { voc: 'Which', de: 'Welche/Welcher/Welches', level: 4, time: 60 },
  { voc: 'From where', de: 'Woher', level: 4, time: 60 },
  { voc: 'Where to', de: 'Wohin', level: 5, time: 60 },
  { voc: 'How much', de: 'Wie viel', level: 5, time: 60 }
]

/**
 * Default decks configuration
 * Used for initializing new decks and as the source of truth for default deck names
 */
export const DEFAULT_DECKS = [
  {
    name: 'en',
    cards: INITIAL_CARDS
  }
]
