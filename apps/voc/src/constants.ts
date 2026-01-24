import type { GameStateFlowConfig } from '@flashcards/shared'

import type { Card } from './types'

/**
 * Base path for the Wordplay app - used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-voc'

// ============================================================================
// GAME STATE FLOW CONFIGURATION
// ============================================================================

/**
 * Centralized game state flow configuration
 * Keys for localStorage and sessionStorage used throughout the game lifecycle
 */
export const GAME_STATE_FLOW_CONFIG: GameStateFlowConfig = {
  settingsKey: 'voc-settings',
  selectedCardsKey: 'voc-selected-cards',
  gameResultKey: 'voc-game-result',
  historyKey: 'voc-history',
  statsKey: 'voc-stats',
  dailyStatsKey: 'voc-daily-stats'
}

export const MAX_CARDS_PER_GAME = 10

// ============================================================================
// GAME SCORING
// ============================================================================

/**
 * Point multiplier for blind mode (medium difficulty)
 */
export const MODE_MULTIPLIER_BLIND = 2

/**
 * Point multiplier for typing mode (high difficulty)
 */
export const MODE_MULTIPLIER_TYPING = 4

/**
 * Points earned for closing answer with typos in typing mode (75% of base)
 */
export const CLOSE_MATCH_SCORE_PERCENTAGE = 0.75

/**
 * Bonus points for answering in DE→Voc direction (increased difficulty)
 */
export const LANGUAGE_BONUS_DE_VOC = 1

export const INITIAL_CARDS: Card[] = [
  { voc: 'Where', de: 'Wo', level: 1, time_blind: 60, time_typing: 60 },
  { voc: 'Who', de: 'Wer', level: 1, time_blind: 60, time_typing: 60 },
  { voc: 'What', de: 'Was', level: 2, time_blind: 60, time_typing: 60 },
  { voc: 'Why', de: 'Warum', level: 2, time_blind: 60, time_typing: 60 },
  { voc: 'When', de: 'Wann', level: 3, time_blind: 60, time_typing: 60 },
  { voc: 'How', de: 'Wie', level: 3, time_blind: 60, time_typing: 60 },
  { voc: 'Which', de: 'Welche/Welcher/Welches', level: 4, time_blind: 60, time_typing: 60 },
  { voc: 'From where', de: 'Woher', level: 4, time_blind: 60, time_typing: 60 },
  { voc: 'Where to', de: 'Wohin', level: 5, time_blind: 60, time_typing: 60 },
  { voc: 'How much', de: 'Wie viel', level: 5, time_blind: 60, time_typing: 60 }
]

/**
 * Levenshtein distance threshold for accepting "close" answers
 * Distance of 2 means up to 2 character changes are tolerated
 */
export const LEVENSHTEIN_THRESHOLD = 2
