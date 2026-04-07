import fc from 'fast-check'
import { beforeEach, describe, expect, it } from 'vitest'

import { filterCardsByDivisor, selectCardsForRound } from '@/services/cardSelector'
import { initializeCards, parseCardQuestion } from '@/services/storage'
import type { Card } from '@/types'

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property: Card selector filters by divisor', () => {
  let allCards: Card[]

  beforeEach(() => {
    localStorage.clear()
    allCards = initializeCards()
  })

  // Feature: div-app, Property 3: Card selector filters by divisor
  // **Validates: Requirements 3.1, 3.3**
  it('filterCardsByDivisor returns only cards whose divisor is in the selection', () => {
    fc.assert(
      fc.property(fc.subarray([2, 3, 4, 5, 6, 7, 8, 9], { minLength: 1 }), selection => {
        const filtered = filterCardsByDivisor(allCards, selection)
        const selectionSet = new Set(selection)

        // Every returned card must have its divisor in the selection
        for (const card of filtered) {
          const { divisor } = parseCardQuestion(card.question)
          if (!selectionSet.has(divisor)) return false
        }

        // Every card in allCards whose divisor IS in the selection must be returned
        const filteredQuestions = new Set(filtered.map(c => c.question))
        for (const card of allCards) {
          const { divisor } = parseCardQuestion(card.question)
          if (selectionSet.has(divisor) && !filteredQuestions.has(card.question)) return false
        }

        return true
      }),
      { numRuns: 100 }
    )
  })
})

// ============================================================================
// Unit Tests
// ============================================================================

describe('filterCardsByDivisor', () => {
  let allCards: Card[]

  beforeEach(() => {
    localStorage.clear()
    allCards = initializeCards()
  })

  it('should return cards for a single divisor', () => {
    const filtered = filterCardsByDivisor(allCards, [3])

    // Every returned card must have divisor 3
    for (const card of filtered) {
      const { divisor } = parseCardQuestion(card.question)
      expect(divisor).toBe(3)
    }

    // Should include all cards with divisor 3 (e.g., 6:3, 8:3, 10:3, ...)
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('should return cards for multiple divisors', () => {
    const filtered = filterCardsByDivisor(allCards, [2, 5])

    for (const card of filtered) {
      const { divisor } = parseCardQuestion(card.question)
      expect([2, 5]).toContain(divisor)
    }

    // Should have more cards than a single divisor
    const singleFiltered = filterCardsByDivisor(allCards, [2])
    expect(filtered.length).toBeGreaterThan(singleFiltered.length)
  })

  it('should return all cards when all divisors are selected', () => {
    const filtered = filterCardsByDivisor(allCards, [2, 3, 4, 5, 6, 7, 8, 9])

    expect(filtered).toHaveLength(allCards.length)
  })

  it('should return empty array for empty selection', () => {
    const filtered = filterCardsByDivisor(allCards, [])

    expect(filtered).toHaveLength(0)
  })
})

describe('selectCardsForRound', () => {
  it('should return all cards when count >= cards.length', () => {
    const cards: Card[] = [
      { question: '18:3', answer: 6, level: 1, time: 60 },
      { question: '18:6', answer: 3, level: 1, time: 60 },
      { question: '24:4', answer: 6, level: 1, time: 60 }
    ]

    const selected = selectCardsForRound(cards, 'weak', 10)
    expect(selected).toHaveLength(3)
  })

  it('should return exactly count cards when count < cards.length', () => {
    const cards: Card[] = [
      { question: '18:3', answer: 6, level: 1, time: 60 },
      { question: '18:6', answer: 3, level: 1, time: 60 },
      { question: '24:4', answer: 6, level: 1, time: 60 },
      { question: '24:6', answer: 4, level: 1, time: 60 },
      { question: '30:5', answer: 6, level: 1, time: 60 },
      { question: '30:6', answer: 5, level: 1, time: 60 },
      { question: '36:6', answer: 6, level: 1, time: 60 }
    ]

    const selected = selectCardsForRound(cards, 'weak', 5)
    expect(selected).toHaveLength(5)
  })

  it('should not mutate the input cards array', () => {
    const cards: Card[] = [
      { question: '18:3', answer: 6, level: 1, time: 60 },
      { question: '18:6', answer: 3, level: 1, time: 60 },
      { question: '24:4', answer: 6, level: 1, time: 60 }
    ]

    const originalLength = cards.length
    selectCardsForRound(cards, 'weak', 2)

    expect(cards).toHaveLength(originalLength)
  })
})
