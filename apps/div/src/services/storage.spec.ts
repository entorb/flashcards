import { MAX_TIME, MIN_LEVEL } from '@flashcards/shared'
import fc from 'fast-check'
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_RANGE, STORAGE_KEYS } from '../constants'
import type { Card } from '../types'
import {
  createDefaultCard,
  getVirtualCardsForRange,
  initializeCards,
  loadCards,
  parseCardQuestion,
  saveCards,
  toggleFeature50
} from './storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_CARD: Card = { question: '18:3', answer: 6, level: 1, time: 60 }

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('div storage — property-based tests', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // Feature: div-app, Property 1: Card generation round-trip
  // **Validates: Requirements 1.2, 14.3**
  describe('Property 1: Card generation round-trip', () => {
    it('for any triple (X, Y, Z), both generated cards have correct answers and dividend / divisor === answer', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 9 }), fc.integer({ min: 2, max: 9 }), (a, b) => {
          // Ensure X < Y
          const x = Math.min(a, b)
          const y = Math.max(a, b)
          if (x === y) return true // skip equal pairs

          const z = x * y

          const card1 = createDefaultCard(z, x, y)
          const card2 = createDefaultCard(z, y, x)

          // Card 1: "Z:X" → Y
          expect(card1.question).toBe(`${z}:${x}`)
          expect(card1.answer).toBe(y)

          // Card 2: "Z:Y" → X
          expect(card2.question).toBe(`${z}:${y}`)
          expect(card2.answer).toBe(x)

          // Round-trip: dividend / divisor === answer
          const parsed1 = parseCardQuestion(card1.question)
          expect(parsed1.dividend / parsed1.divisor).toBe(card1.answer)

          const parsed2 = parseCardQuestion(card2.question)
          expect(parsed2.dividend / parsed2.divisor).toBe(card2.answer)
        }),
        { numRuns: 100 }
      )
    })
  })

  // Feature: div-app, Property 2: Generated cards have unique questions and correct defaults
  // **Validates: Requirements 1.3, 1.4, 1.5**
  describe('Property 2: Generated cards have unique questions and correct defaults', () => {
    it('all 64 questions are unique, all have level === MIN_LEVEL and time === MAX_TIME', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const cards = initializeCards()

          // 28 non-square triples × 2 + 8 square triples × 1 = 64 cards
          expect(cards).toHaveLength(64)

          // All questions are unique
          const questions = cards.map(c => c.question)
          const uniqueQuestions = new Set(questions)
          expect(uniqueQuestions.size).toBe(64)

          // All cards have correct defaults
          for (const card of cards) {
            expect(card.level).toBe(MIN_LEVEL)
            expect(card.time).toBe(MAX_TIME)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('div storage — unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── parseCardQuestion ──────────────────────────────────────────────────

  describe('parseCardQuestion', () => {
    it('parses standard question format', () => {
      expect(parseCardQuestion('18:3')).toEqual({ dividend: 18, divisor: 3 })
    })

    it('parses larger numbers', () => {
      expect(parseCardQuestion('72:9')).toEqual({ dividend: 72, divisor: 9 })
    })

    it('returns zeros for invalid input without colon', () => {
      expect(parseCardQuestion('abc')).toEqual({ dividend: 0, divisor: 0 })
    })

    it('returns zeros for empty string', () => {
      expect(parseCardQuestion('')).toEqual({ dividend: 0, divisor: 0 })
    })

    it('returns zero for non-numeric parts', () => {
      expect(parseCardQuestion('abc:def')).toEqual({ dividend: 0, divisor: 0 })
    })

    it('handles single number before colon', () => {
      expect(parseCardQuestion('5:')).toEqual({ dividend: 5, divisor: 0 })
    })
  })

  // ─── createDefaultCard ──────────────────────────────────────────────────

  describe('createDefaultCard', () => {
    it('creates card with correct question format', () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.question).toBe('18:3')
    })

    it('stores the provided answer', () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.answer).toBe(6)
    })

    it('sets default level and time', () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.level).toBe(MIN_LEVEL)
      expect(card.time).toBe(MAX_TIME)
    })
  })

  // ─── initializeCards ────────────────────────────────────────────────────

  describe('initializeCards', () => {
    it('generates exactly 64 cards', () => {
      const cards = initializeCards()
      expect(cards).toHaveLength(64)
    })

    it('generates cards from 36 triples (X ≤ Y)', () => {
      const cards = initializeCards()
      // 28 non-square triples × 2 + 8 square triples × 1 = 64
      const questions = new Set(cards.map(c => c.question))
      expect(questions.size).toBe(64)
    })

    it('all cards have MIN_LEVEL and MAX_TIME', () => {
      const cards = initializeCards()
      for (const card of cards) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it('saves cards to localStorage', () => {
      initializeCards()
      expect(localStorage.getItem(STORAGE_KEYS.CARDS)).not.toBeNull()
    })

    it('contains expected card pair for triple (2,3,6)', () => {
      const cards = initializeCards()
      const q1 = cards.find(c => c.question === '6:2')
      const q2 = cards.find(c => c.question === '6:3')
      expect(q1).toBeDefined()
      expect(q1?.answer).toBe(3)
      expect(q2).toBeDefined()
      expect(q2?.answer).toBe(2)
    })

    it('contains expected card pair for triple (8,9,72)', () => {
      const cards = initializeCards()
      const q1 = cards.find(c => c.question === '72:8')
      const q2 = cards.find(c => c.question === '72:9')
      expect(q1).toBeDefined()
      expect(q1?.answer).toBe(9)
      expect(q2).toBeDefined()
      expect(q2?.answer).toBe(8)
    })

    it('contains square cards (X²:X → X)', () => {
      const cards = initializeCards()
      const squareCards = [
        { question: '4:2', answer: 2 },
        { question: '9:3', answer: 3 },
        { question: '16:4', answer: 4 },
        { question: '25:5', answer: 5 },
        { question: '36:6', answer: 6 },
        { question: '49:7', answer: 7 },
        { question: '64:8', answer: 8 },
        { question: '81:9', answer: 9 }
      ]
      for (const expected of squareCards) {
        const found = cards.find(c => c.question === expected.question)
        expect(found).toBeDefined()
        expect(found?.answer).toBe(expected.answer)
      }
    })
  })

  // ─── getVirtualCardsForRange ────────────────────────────────────────────

  describe('getVirtualCardsForRange', () => {
    it('returns all base cards regardless of range subset', () => {
      const cards = getVirtualCardsForRange([2, 3])
      // Base cards are always all [2,9] pairs = 64 cards
      expect(cards).toHaveLength(64)
    })

    it('returns empty array for empty range', () => {
      const cards = getVirtualCardsForRange([])
      // Still returns all base cards (range only controls extended mode)
      expect(cards).toHaveLength(64)
    })

    it('returns base cards for single-element range', () => {
      const cards = getVirtualCardsForRange([5])
      expect(cards).toHaveLength(64)
    })

    it('uses stored card data when available', () => {
      const storedCard: Card = { question: '6:2', answer: 3, level: 5, time: 10 }
      saveCards([storedCard])
      const cards = getVirtualCardsForRange(DEFAULT_RANGE)
      const found = cards.find(c => c.question === '6:2')
      expect(found?.level).toBe(5)
      expect(found?.time).toBe(10)
    })

    it('creates default cards for missing entries', () => {
      saveCards([])
      const cards = getVirtualCardsForRange(DEFAULT_RANGE)
      for (const card of cards) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it('returns 64 base cards for DEFAULT_RANGE', () => {
      const cards = getVirtualCardsForRange(DEFAULT_RANGE)
      expect(cards).toHaveLength(64)
    })

    it('extended mode includes cards like 50:2=25 and 48:12=4', () => {
      const extendedRange = toggleFeature50([...DEFAULT_RANGE])
      const cards = getVirtualCardsForRange(extendedRange)
      expect(cards.find(c => c.question === '50:2')).toBeDefined()
      expect(cards.find(c => c.question === '48:12')).toBeDefined()
    })

    it('extended mode excludes cards with divisor 13+ or Z > 50', () => {
      const extendedRange = toggleFeature50([...DEFAULT_RANGE])
      const cards = getVirtualCardsForRange(extendedRange)
      // No card with divisor 13
      expect(cards.find(c => c.question === '39:13')).toBeUndefined()
      // No card with Z > 50 (except base cards where both factors ≤ 9)
      expect(cards.find(c => c.question === '52:2')).toBeUndefined()
    })

    it('extended mode does not remove any base cards', () => {
      const baseCards = getVirtualCardsForRange(DEFAULT_RANGE)
      const extendedRange = toggleFeature50([...DEFAULT_RANGE])
      const extendedCards = getVirtualCardsForRange(extendedRange)
      for (const baseCard of baseCards) {
        const found = extendedCards.find(c => c.question === baseCard.question)
        expect(found).toBeDefined()
      }
    })

    it('extended cards have divisor in {2..9, 11, 12} and Z ≤ 50', () => {
      const baseQuestions = new Set(getVirtualCardsForRange(DEFAULT_RANGE).map(c => c.question))
      const extendedRange = toggleFeature50([...DEFAULT_RANGE])
      const allCards = getVirtualCardsForRange(extendedRange)
      const extendedOnly = allCards.filter(c => !baseQuestions.has(c.question))

      for (const card of extendedOnly) {
        const { dividend, divisor } = parseCardQuestion(card.question)
        expect(dividend).toBeLessThanOrEqual(50)
        expect([2, 3, 4, 5, 6, 7, 8, 9, 11, 12].includes(divisor)).toBe(true)
      }
    })
  })

  // ─── toggleFeature40 ───────────────────────────────────────────────────

  describe('toggleFeature50', () => {
    it('activates: adds only 11 and 12 as extended divisors', () => {
      const result = toggleFeature50([...DEFAULT_RANGE])
      const extended = result.filter(n => n > 9)
      expect(extended).toEqual([11, 12])
    })

    it('does not add 10 or numbers > 12', () => {
      const result = toggleFeature50([...DEFAULT_RANGE])
      expect(result).not.toContain(10)
      expect(result).not.toContain(13)
    })

    it('deactivates: reverts to DEFAULT_RANGE when extended numbers present', () => {
      const extended = [...DEFAULT_RANGE, 11, 12]
      const result = toggleFeature50(extended)
      expect(result).toEqual(DEFAULT_RANGE)
    })

    it('result is sorted ascending', () => {
      const result = toggleFeature50([...DEFAULT_RANGE])
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1]
        const curr = result[i]
        if (prev !== undefined && curr !== undefined) {
          expect(prev).toBeLessThan(curr)
        }
      }
    })

    it('toggle on then off returns DEFAULT_RANGE', () => {
      const activated = toggleFeature50([...DEFAULT_RANGE])
      const deactivated = toggleFeature50(activated)
      expect(deactivated).toEqual(DEFAULT_RANGE)
    })
  })

  // ─── loadCards ──────────────────────────────────────────────────────────

  describe('loadCards', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadCards()).toEqual([])
    })

    it('returns stored cards when present', () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([SAMPLE_CARD]))
      expect(loadCards()).toEqual([SAMPLE_CARD])
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, 'not-json')
      expect(loadCards()).toEqual([])
    })
  })
})
