/**
 * Division App - Storage Service
 * Uses shared factory for common operations, keeps app-specific logic here.
 */

import {
  createAppStorageFactory,
  isNumber,
  isRecord,
  isValidBaseSettings,
  MAX_TIME,
  MIN_LEVEL,
  saveJSON,
} from "@flashcards/shared"

import { DEFAULT_RANGE, STORAGE_KEYS } from "@/constants"
import type { Card, GameHistory, GameSettings } from "@/types"

/** GameSettings shape check: base fields + numeric select array */
function isValidSettings(value: unknown): boolean {
  if (!(isValidBaseSettings(value) && isRecord(value))) return false
  const { select } = value
  return Array.isArray(select) && select.every((n) => isNumber(n))
}

// ============================================================================
// UTILITY FUNCTIONS (app-specific)
// ============================================================================

/**
 * Parse a card question string into dividend and divisor numbers
 * @param question - Card question in format "Z:D" (e.g., "18:3")
 * @returns Object with dividend and divisor numbers, or { dividend: 0, divisor: 0 } for invalid input
 */
export function parseCardQuestion(question: string): { dividend: number; divisor: number } {
  const [dividendStr, divisorStr] = question.split(":")
  const dividend = Number.parseInt(dividendStr ?? "", 10) || 0
  const divisor = Number.parseInt(divisorStr ?? "", 10) || 0
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
    time: MAX_TIME,
  }
}

// ============================================================================
// SHARED FACTORY
// ============================================================================

const factory = createAppStorageFactory<Card, GameHistory, GameSettings>({
  storageKeys: STORAGE_KEYS,
  defaultRange: DEFAULT_RANGE,
  isValidSettings,
  createCardFromQuestion: (question: string) => {
    const { dividend, divisor } = parseCardQuestion(question)
    const answer = divisor === 0 ? 0 : dividend / divisor
    return createDefaultCard(dividend, divisor, answer)
  },
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
  answer: number,
): Card {
  return cardMap.get(question) ?? createDefaultCard(dividend, divisor, answer)
}

/**
 * Generate virtual cards for all triples X ≤ Y in [2,9] (Z = X × Y)
 * Non-square triples yield two cards, square triples one (64 total)
 */
export function getVirtualCards(storedCards: Card[] = factory.loadCards()): Card[] {
  const cardMap = new Map(storedCards.map((c) => [c.question, c]))
  const cards: Card[] = []

  for (let x = 2; x <= 9; x++) {
    for (let y = x; y <= 9; y++) {
      const z = x * y
      cards.push(resolveCard(`${z}:${x}`, cardMap, z, x, y))
      if (x !== y) cards.push(resolveCard(`${z}:${y}`, cardMap, z, y, x))
    }
  }

  return cards
}

// TODO: delete after 1.10.2026
/**
 * Migration: delete stored cards with divisor 11 or 12 (removed feature)
 */
export function removeLegacyDivisorCards(): void {
  const cards = factory.loadCards()
  const kept = cards.filter((c) => parseCardQuestion(c.question).divisor <= 9)
  if (kept.length !== cards.length) factory.saveCards(kept)
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
  loadGameStats,
  saveGameStats,
  setGameConfig,
  getGameConfig,
  setGameResult,
  saveGameState,
  loadGameState,
  clearGameState,
  loadRange,
} = factory

// Only used in .vue page files
export const { getGameResult, clearGameResult, incrementDailyGames, loadSettings, saveSettings } =
  factory
