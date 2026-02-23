import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { selectCardsByFocus } from '../services/storage'
import { shuffleArray, weightedRandomSelection } from './cardSelection'

// Validates: Requirements 7.1, 7.2

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
  })

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect([...result].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b))
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    shuffleArray(input)
    expect(input).toEqual(copy)
  })

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('handles single-element array', () => {
    expect(shuffleArray([42])).toEqual([42])
  })
})

describe('weightedRandomSelection', () => {
  it('returns the requested count of items', () => {
    const items = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 2 },
      { item: 'c', weight: 3 }
    ]
    const result = weightedRandomSelection(items, 2)
    expect(result).toHaveLength(2)
  })

  it('returns all items when count >= length', () => {
    const items = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 }
    ]
    const result = weightedRandomSelection(items, 10)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(weightedRandomSelection([], 5)).toEqual([])
  })

  it('returns no duplicates', () => {
    const items = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ]
    const result = weightedRandomSelection(items, 3)
    expect(new Set(result).size).toBe(result.length)
  })
})

describe('selectCardsByFocus', () => {
  const makeCards = (levels: number[]) => levels.map((level, i) => ({ level, time: 60 + i }))

  describe('focus: weak', () => {
    it('returns at most maxCards cards', () => {
      const cards = makeCards([1, 2, 3, 4, 5, 1, 2, 3])
      const result = selectCardsByFocus({ cards, focus: 'weak', maxCards: 3 })
      expect(result.length).toBeLessThanOrEqual(3)
    })

    it('returns all cards when maxCards >= total', () => {
      const cards = makeCards([1, 2, 3])
      const result = selectCardsByFocus({ cards, focus: 'weak', maxCards: 10 })
      expect(result).toHaveLength(3)
    })
  })

  describe('focus: medium', () => {
    it('returns at most maxCards cards', () => {
      const cards = makeCards([1, 2, 3, 4, 5])
      const result = selectCardsByFocus({ cards, focus: 'medium', maxCards: 3 })
      expect(result.length).toBeLessThanOrEqual(3)
    })
  })

  describe('focus: strong', () => {
    it('returns at most maxCards cards', () => {
      const cards = makeCards([1, 2, 3, 4, 5])
      const result = selectCardsByFocus({ cards, focus: 'strong', maxCards: 2 })
      expect(result.length).toBeLessThanOrEqual(2)
    })
  })

  describe('focus: slow', () => {
    it('returns cards sorted by time descending when timeExtractor provided', () => {
      const cards = [
        { level: 1, time: 10 },
        { level: 2, time: 90 },
        { level: 3, time: 50 }
      ]
      const result = selectCardsByFocus({
        cards,
        focus: 'slow',
        maxCards: 3,
        timeExtractor: c => c.time
      })
      expect(result[0]!.time).toBe(90)
      expect(result[1]!.time).toBe(50)
      expect(result[2]!.time).toBe(10)
    })

    it('falls back to weighted selection when no timeExtractor', () => {
      const cards = makeCards([1, 2, 3, 4, 5])
      const result = selectCardsByFocus({ cards, focus: 'slow', maxCards: 3 })
      expect(result.length).toBeLessThanOrEqual(3)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = selectCardsByFocus({ cards: [], focus: 'weak', maxCards: 5 })
      expect(result).toEqual([])
    })

    it('returns empty array when maxCards is 0', () => {
      const cards = makeCards([1, 2, 3])
      const result = selectCardsByFocus({ cards, focus: 'medium', maxCards: 0 })
      expect(result).toHaveLength(0)
    })

    it('handles all cards at the same level', () => {
      const cards = makeCards([3, 3, 3, 3, 3])
      const result = selectCardsByFocus({ cards, focus: 'weak', maxCards: 3 })
      expect(result.length).toBeLessThanOrEqual(3)
      for (const card of result) {
        expect(card.level).toBe(3)
      }
    })

    it('applies modeFilter before selection', () => {
      const cards = [
        { level: 1, time: 60 },
        { level: 2, time: 60 },
        { level: 3, time: 60 }
      ]
      const result = selectCardsByFocus({
        cards,
        focus: 'weak',
        maxCards: 10,
        modeFilter: c => c.level <= 2
      })
      expect(result.every(c => c.level <= 2)).toBe(true)
    })

    it('returns empty array when modeFilter excludes all cards', () => {
      const cards = makeCards([1, 2, 3])
      const result = selectCardsByFocus({
        cards,
        focus: 'medium',
        maxCards: 5,
        modeFilter: () => false
      })
      expect(result).toEqual([])
    })
  })
})

describe('selectCardsByFocus — property tests', () => {
  // Validates: Requirements 7.1
  it('selected count is always <= total count and <= maxCards', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            level: fc.integer({ min: 1, max: 5 }),
            time: fc.integer({ min: 1, max: 120 })
          }),
          { minLength: 1, maxLength: 100 }
        ),
        fc.integer({ min: 1, max: 50 }),
        fc.constantFrom('weak' as const, 'medium' as const, 'strong' as const, 'slow' as const),
        (cards, maxCards, focus) => {
          const result = selectCardsByFocus({ cards, focus, maxCards })
          return result.length <= cards.length && result.length <= maxCards
        }
      )
    )
  })

  // Validates: Requirements 7.2
  it('all selected cards have valid levels (1–5)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            level: fc.integer({ min: 1, max: 5 }),
            time: fc.integer({ min: 1, max: 120 })
          }),
          { minLength: 1, maxLength: 100 }
        ),
        fc.constantFrom('weak' as const, 'medium' as const, 'strong' as const, 'slow' as const),
        (cards, focus) => {
          const result = selectCardsByFocus({ cards, focus, maxCards: 20 })
          return result.every(c => c.level >= 1 && c.level <= 5)
        }
      )
    )
  })
})
