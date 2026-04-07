/**
 * Division App - Storage Service
 * Uses shared factory for common operations, keeps app-specific logic here.
 */

import { createAppStorageFactory, MAX_TIME, MIN_LEVEL, saveJSON } from '@flashcards/shared'

import { DEFAULT_RANGE, STORAGE_KEYS } from '@/constants'
import type { Card, GameHistory, GameSettings } from '@/types'

// ============================================================================
// UTILITY FUNCTIONS (app-specific)
// ============================================================================

/**
 * Parse a card question string into dividend and divisor numbers
 * @param question - Card question in format "Z:D" (e.g., "18:3")
 * @returns Object with dividend and divisor numbers, or { dividend: 0, divisor: 0 } for invalid input
 */
export function parseCardQuestion(question: string): { dividend: number; divisor: number } {
  const [dividendStr, divisorStr] = question.split(':')
  const dividend = Number.parseInt(dividendStr ?? '', 10) || 0
  const divisor = Number.parseInt(divisorStr ?? '', 10) || 0
  return { dividend, divisor }
}

/**
 * Create a default card with initial level and time
 * @param dividend - The dividend (product Z)
 * @param divisor - The divisor (factor X or Y)
 * @param answer - The answer (the other factor)
 * @returns Card with default values
 */
export function createDefaultCard(dividend: number, divisor: number, answer: number): Card {
  return {
    question: `${dividend}:${divisor}`,
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
  defaultRange: DEFAULT_RANGE,
  appLabel: 'div',
  createCardFromQuestion: (question: string) => {
    const { dividend, divisor } = parseCardQuestion(question)
    const answer = divisor === 0 ? 0 : dividend / divisor
    return createDefaultCard(dividend, divisor, answer)
  }
})

// ============================================================================
// APP-SPECIFIC CARD OPERATIONS
// ============================================================================

/**
 * Generate card pairs from a triple (x, y, z=x*y)
 * Returns two cards: "Z:X" → Y and "Z:Y" → X
 */
function cardsFromTriple(x: number, y: number): [Card, Card] {
  const z = x * y
  return [createDefaultCard(z, x, y), createDefaultCard(z, y, x)]
}

/**
 * Initialize all division cards for the app
 * Generates 64 cards from 36 triples (X, Y ∈ [2,9], X ≤ Y, Z = X × Y)
 * Non-square triples (X < Y) yield two cards: "Z:X" → Y and "Z:Y" → X (28 × 2 = 56)
 * Square triples (X = Y) yield one card: "X²:X" → X (8 × 1 = 8)
 */
export function initializeCards(): Card[] {
  const cards: Card[] = []

  for (let x = 2; x <= 9; x++) {
    // Square card: X²:X → X
    const z = x * x
    cards.push(createDefaultCard(z, x, x))

    for (let y = x + 1; y <= 9; y++) {
      cards.push(...cardsFromTriple(x, y))
    }
  }

  saveJSON(STORAGE_KEYS.CARDS, cards)
  return cards
}

/**
 * Resolve a card question: return stored card if exists, otherwise create virtual default
 */
function resolveCard(
  question: string,
  cardMap: Map<string, Card>,
  dividend: number,
  divisor: number,
  answer: number
): Card {
  return cardMap.get(question) ?? createDefaultCard(dividend, divisor, answer)
}

/**
 * Valid divisors for extended ≤50 mode
 */
const EXTENDED_DIVISORS = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]

/**
 * Generate base virtual cards for all triples where X ≤ Y and both are in [2,9]
 * Non-square triples (X < Y) yield two cards, square triples (X = Y) yield one card
 */
function generateBaseVirtualCards(cardMap: Map<string, Card>): Card[] {
  const cards: Card[] = []

  for (let x = 2; x <= 9; x++) {
    for (let y = x; y <= 9; y++) {
      const z = x * y
      if (x === y) {
        cards.push(resolveCard(`${z}:${x}`, cardMap, z, x, x))
      } else {
        cards.push(
          resolveCard(`${z}:${x}`, cardMap, z, x, y),
          resolveCard(`${z}:${y}`, cardMap, z, y, x)
        )
      }
    }
  }

  return cards
}

/**
 * Generate extended virtual cards for ≤50 mode
 * Enumerates all Z ∈ [2,50], divisor ∈ EXTENDED_DIVISORS where Z % divisor === 0
 * Skips cards already in the base set (both factors in [2,9])
 */
function generateExtendedVirtualCards(
  cardMap: Map<string, Card>,
  baseQuestions: Set<string>
): Card[] {
  const cards: Card[] = []
  const seen = new Set<string>()

  for (let z = 2; z <= 50; z++) {
    for (const divisor of EXTENDED_DIVISORS) {
      if (z % divisor !== 0) continue
      const answer = z / divisor
      if (answer < 2 || divisor === answer) continue

      const question = `${z}:${divisor}`
      if (baseQuestions.has(question) || seen.has(question)) continue

      cards.push(resolveCard(question, cardMap, z, divisor, answer))
      seen.add(question)
    }
  }

  return cards
}

/**
 * Generate virtual cards for the current mode
 * Base mode (no extended): cards with both factors in [2,9]
 * Extended mode: base cards + all Z ≤ 50 cards with divisor ∈ {2..9, 11, 12}
 */
export function getVirtualCardsForRange(range: number[]): Card[] {
  const storedCards = factory.loadCards()
  const cardMap = new Map(storedCards.map(c => [c.question, c]))

  const baseCards = generateBaseVirtualCards(cardMap)
  const isExtended = range.some(n => n > 9)

  if (!isExtended) return baseCards

  const baseQuestions = new Set(baseCards.map(c => c.question))
  const extendedCards = generateExtendedVirtualCards(cardMap, baseQuestions)

  return [...baseCards, ...extendedCards]
}

/**
 * Toggle the ≤50 extended range feature
 * When activated: adds divisors 11 and 12 (signals extended mode for card generation)
 * When deactivated: reverts to DEFAULT_RANGE
 * @param current - Current range array
 * @returns New range array
 */
export function toggleFeature50(current: number[]): number[] {
  // Check if extended range is currently active (any number > 9 present)
  const hasExtended = current.some(n => n > 9)

  if (hasExtended) {
    // Deactivate: revert to default range
    return [...DEFAULT_RANGE]
  }

  // Activate: add 11 and 12 as extended divisors
  return [...current, 11, 12].sort((a, b) => a - b)
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
