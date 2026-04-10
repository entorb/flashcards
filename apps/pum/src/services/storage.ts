/**
 * PlusMinus App - Storage Service
 * Uses shared factory for common operations, keeps app-specific logic here.
 */

import { createAppStorageFactory, MAX_TIME, MIN_LEVEL, saveJSON } from '@flashcards/shared'

import { STORAGE_KEYS } from '@/constants'
import type { Card, Difficulty, GameHistory, GameSettings, Operation } from '@/types'

// ============================================================================
// UTILITY FUNCTIONS (app-specific)
// ============================================================================

/**
 * Parse a card question string into operands and operator
 * @param question - Card question in format "X+Y" or "X-Y" (e.g., "7+3" or "15-8")
 * @returns Object with x, operator, and y values, or { x: 0, operator: '+', y: 0 } for invalid input
 */
export function parseCardQuestion(question: string): {
  x: number
  operator: '+' | '-'
  y: number
} {
  const plusIndex = question.indexOf('+')
  const minusIndex = question.indexOf('-')

  let operator: '+' | '-'
  let splitIndex: number

  if (plusIndex !== -1) {
    operator = '+'
    splitIndex = plusIndex
  } else if (minusIndex === -1) {
    return { x: 0, operator: '+', y: 0 }
  } else {
    operator = '-'
    splitIndex = minusIndex
  }

  const x = Number.parseInt(question.slice(0, splitIndex), 10) || 0
  const y = Number.parseInt(question.slice(splitIndex + 1), 10) || 0
  return { x, operator, y }
}

/**
 * Create a default card with initial level and time
 * @param x - The first operand
 * @param operator - The operator ('+' or '-')
 * @param y - The second operand
 * @returns Card with default values
 */
export function createDefaultCard(x: number, operator: '+' | '-', y: number): Card {
  const answer = operator === '+' ? x + y : x - y
  return {
    question: `${x}${operator}${y}`,
    answer,
    level: MIN_LEVEL,
    time: MAX_TIME
  }
}

// ============================================================================
// SHARED FACTORY
// ============================================================================

const factory = createAppStorageFactory<Card, GameHistory, GameSettings>({
  storageKeys: STORAGE_KEYS,
  defaultRange: [],
  appLabel: 'pum',
  createCardFromQuestion: (question: string) => {
    const { x, operator, y } = parseCardQuestion(question)
    return createDefaultCard(x, operator, y)
  }
})

// ============================================================================
// APP-SPECIFIC CARD OPERATIONS
// ============================================================================

/**
 * Generate simple difficulty cards: X in [1..10], Y in [1..10], X >= Y → 55 cards
 */
function generateSimpleCards(operator: '+' | '-'): Card[] {
  const cards: Card[] = []
  for (let x = 1; x <= 10; x++) {
    for (let y = 1; y <= x; y++) {
      cards.push(createDefaultCard(x, operator, y))
    }
  }
  return cards
}

/**
 * Generate medium difficulty cards: X in [11..20], Y in [1..10] → 100 cards
 */
function generateMediumCards(operator: '+' | '-'): Card[] {
  const cards: Card[] = []
  for (let x = 11; x <= 20; x++) {
    for (let y = 1; y <= 10; y++) {
      cards.push(createDefaultCard(x, operator, y))
    }
  }
  return cards
}

/**
 * Generate advanced difficulty cards: X in [11..20], Y in [11..20], X >= Y → 55 cards
 */
function generateAdvancedCards(operator: '+' | '-'): Card[] {
  const cards: Card[] = []
  for (let x = 11; x <= 20; x++) {
    for (let y = 11; y <= x; y++) {
      cards.push(createDefaultCard(x, operator, y))
    }
  }
  return cards
}

/**
 * Initialize all plus/minus cards for the app
 * Generates 420 cards from 2 operations × 3 difficulties:
 * - Simple: X in [1..10], Y in [1..10], X >= Y → 55 cards per op
 * - Medium: X in [11..20], Y in [1..10] → 100 cards per op
 * - Advanced: X in [11..20], Y in [11..20], X >= Y → 55 cards per op
 */
export function initializeCards(): Card[] {
  const cards: Card[] = []

  for (const op of ['plus', 'minus'] as const) {
    const operator: '+' | '-' = op === 'plus' ? '+' : '-'
    cards.push(
      ...generateSimpleCards(operator),
      ...generateMediumCards(operator),
      ...generateAdvancedCards(operator)
    )
  }

  saveJSON(STORAGE_KEYS.CARDS, cards)
  return cards
}

/**
 * Calculate scoring difficulty for a card
 * Difficulty = Y (the smaller operand, since X >= Y) + operator bonus (2 for minus, 0 for plus)
 */
export function getDifficultyForCard(card: Card): number {
  const { y, operator } = parseCardQuestion(card.question)
  const operatorBonus = operator === '-' ? 2 : 0
  return y + operatorBonus
}

/**
 * Get the operation type from a card question string
 */
export function getOperationFromQuestion(question: string): Operation {
  return question.includes('+') ? 'plus' : 'minus'
}

/**
 * Get the difficulty level from a card question string
 */
export function getDifficultyFromQuestion(question: string): Difficulty {
  const { x, y } = parseCardQuestion(question)
  if (x <= 10 && y <= 10) return 'simple'
  if (x >= 11 && y >= 11) return 'advanced'
  return 'medium'
}

// ============================================================================
// RE-EXPORT SHARED FACTORY FUNCTIONS (preserves public API)
// ============================================================================

export const {
  loadCards,
  saveCards,
  updateCard,
  resetCards,
  loadHistory,
  saveHistory,
  addHistory,
  loadGameStats,
  saveGameStats,
  updateStatistics,
  setGameConfig,
  getGameConfig,
  setGameResult,
  getGameResult,
  clearGameResult,
  incrementDailyGames,
  saveGameState,
  loadGameState,
  clearGameState,
  loadRange,
  saveRange,
  loadSettings,
  saveSettings,
  resetAll
} = factory
