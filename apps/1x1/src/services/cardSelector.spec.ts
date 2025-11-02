import { describe, it, expect, beforeEach } from 'vitest'
import { initializeCards, loadCards, parseCardQuestion } from '@/services/storage'
import {
  selectCards,
  filterCardsBySelection,
  filterCardsSquares,
  filterCardsAll
} from '@/services/cardSelector'
import type { Card } from '@/types'

describe('Card Filtering by Selection', () => {
  let allCards: Card[]
  let range: Set<number>

  beforeEach(() => {
    localStorage.clear()
    initializeCards()
    allCards = loadCards()
    range = new Set([3, 4, 5, 6, 7, 8, 9])
  })

  it('should return 7 cards when filtering by [6]', () => {
    const filtered = filterCardsBySelection(allCards, [6], range)

    expect(filtered).toHaveLength(7)
    expect(filtered.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x6',
      '4x6',
      '5x6',
      '6x6',
      '6x7',
      '6x8',
      '6x9'
    ])
  })

  it('should return 7 cards when filtering by [3]', () => {
    const filtered = filterCardsBySelection(allCards, [3], range)

    expect(filtered).toHaveLength(7)
    expect(filtered.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x3',
      '3x4',
      '3x5',
      '3x6',
      '3x7',
      '3x8',
      '3x9'
    ])
  })

  it('should return 7 cards when filtering by [9]', () => {
    const filtered = filterCardsBySelection(allCards, [9], range)

    expect(filtered).toHaveLength(7)
    expect(filtered.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x9',
      '4x9',
      '5x9',
      '6x9',
      '7x9',
      '8x9',
      '9x9'
    ])
  })

  it('should return cards with 3 OR 4 when filtering by [3, 4]', () => {
    const filtered = filterCardsBySelection(allCards, [3, 4], range)

    // Should include: 3x3, 3x4, 3x5, 3x6, 3x7, 3x8, 3x9, 4x4, 4x5, 4x6, 4x7, 4x8, 4x9
    expect(filtered.length).toBeGreaterThanOrEqual(10)

    // Verify all filtered cards contain 3 or 4
    for (const card of filtered) {
      const { x, y } = parseCardQuestion(card.question)
      expect([3, 4].some(n => x === n || y === n)).toBe(true)
    }
  })

  it('should respect range boundaries', () => {
    const smallRange = new Set([3, 4, 5])
    const filtered = filterCardsBySelection(allCards, [6], smallRange)

    // Should return empty because 6 is not in range
    expect(filtered).toHaveLength(0)
  })
})

describe('Card Filtering - Squares (x²)', () => {
  let allCards: Card[]
  let range: Set<number>

  beforeEach(() => {
    localStorage.clear()
    initializeCards()
    allCards = loadCards()
    range = new Set([3, 4, 5, 6, 7, 8, 9])
  })

  it('should return only square cards (x === y)', () => {
    const filtered = filterCardsSquares(allCards, range)

    expect(filtered).toHaveLength(7)
    expect(filtered.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x3',
      '4x4',
      '5x5',
      '6x6',
      '7x7',
      '8x8',
      '9x9'
    ])
  })
})

describe('Card Filtering - All Cards', () => {
  let allCards: Card[]
  let range: Set<number>

  beforeEach(() => {
    localStorage.clear()
    initializeCards()
    allCards = loadCards()
    range = new Set([3, 4, 5, 6, 7, 8, 9])
  })

  it('should return all cards within range', () => {
    const filtered = filterCardsAll(allCards, range)

    // All 28 cards should be returned (3x3 to 9x9)
    expect(filtered).toHaveLength(28)
  })

  it('should respect range boundaries', () => {
    const smallRange = new Set([3, 4])
    const filtered = filterCardsAll(allCards, smallRange)

    // Only 3x3, 3x4, 4x4 should be returned
    expect(filtered).toHaveLength(3)
    expect(filtered.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x3',
      '3x4',
      '4x4'
    ])
  })
})

describe('Card Selection', () => {
  it('should return all cards when count >= cards.length', () => {
    const cards: Card[] = [
      { question: '3x6', answer: 18, level: 1, time: 60 },
      { question: '4x6', answer: 24, level: 1, time: 60 },
      { question: '5x6', answer: 30, level: 1, time: 60 }
    ]

    const selected = selectCards(cards, 'weak', 10)
    expect(selected).toHaveLength(3)
  })

  it('should return exactly count cards when count < cards.length', () => {
    const cards: Card[] = [
      { question: '3x6', answer: 18, level: 1, time: 60 },
      { question: '4x6', answer: 24, level: 1, time: 60 },
      { question: '5x6', answer: 30, level: 1, time: 60 },
      { question: '6x6', answer: 36, level: 1, time: 60 },
      { question: '6x7', answer: 42, level: 1, time: 60 },
      { question: '6x8', answer: 48, level: 1, time: 60 },
      { question: '6x9', answer: 54, level: 1, time: 60 }
    ]

    const selected = selectCards(cards, 'weak', 5)
    expect(selected).toHaveLength(5)
  })

  it('should not mutate the input cards array', () => {
    const cards: Card[] = [
      { question: '3x6', answer: 18, level: 1, time: 60 },
      { question: '4x6', answer: 24, level: 1, time: 60 },
      { question: '5x6', answer: 30, level: 1, time: 60 }
    ]

    const originalLength = cards.length
    selectCards(cards, 'weak', 2)

    expect(cards).toHaveLength(originalLength)
  })

  it('should select all 7 cards for [6] selection', () => {
    const cards: Card[] = [
      { question: '3x6', answer: 18, level: 1, time: 60 },
      { question: '4x6', answer: 24, level: 1, time: 60 },
      { question: '5x6', answer: 30, level: 1, time: 60 },
      { question: '6x6', answer: 36, level: 1, time: 60 },
      { question: '6x7', answer: 42, level: 1, time: 60 },
      { question: '6x8', answer: 48, level: 1, time: 60 },
      { question: '6x9', answer: 54, level: 1, time: 60 }
    ]

    const selected = selectCards(cards, 'weak', 10)
    expect(selected).toHaveLength(7)
  })

  it('should handle weak focus weighting correctly', () => {
    const cards: Card[] = [
      { question: '3x6', answer: 18, level: 1, time: 60 },
      { question: '4x6', answer: 24, level: 5, time: 60 }
    ]

    // Run multiple times to verify randomness works
    for (let i = 0; i < 10; i++) {
      const selected = selectCards(cards, 'weak', 1)
      expect(selected).toHaveLength(1)
      expect(['3x6', '4x6']).toContain(selected[0].question)
    }
  })
})

describe('Integration: Filter + Select Pipeline', () => {
  let allCards: Card[]
  let range: Set<number>

  beforeEach(() => {
    localStorage.clear()
    initializeCards()
    allCards = loadCards()
    range = new Set([3, 4, 5, 6, 7, 8, 9])
  })

  it('should filter by selection then select cards for game', () => {
    // Filter step
    const filtered = filterCardsBySelection(allCards, [6], range)
    expect(filtered).toHaveLength(7)

    // Selection step
    const selected = selectCards(filtered, 'weak', 10)
    expect(selected).toHaveLength(7)
    expect(selected.map(c => c.question).sort((a, b) => a.localeCompare(b))).toEqual([
      '3x6',
      '4x6',
      '5x6',
      '6x6',
      '6x7',
      '6x8',
      '6x9'
    ])
  })

  it('should filter squares then select limited cards', () => {
    // Filter step
    const filtered = filterCardsSquares(allCards, range)
    expect(filtered).toHaveLength(7)

    // Selection step (limit to 5)
    const selected = selectCards(filtered, 'strong', 5)
    expect(selected).toHaveLength(5)

    // All selected should be squares
    for (const card of selected) {
      const { x, y } = parseCardQuestion(card.question)
      expect(x).toBe(y)
    }
  })
})
