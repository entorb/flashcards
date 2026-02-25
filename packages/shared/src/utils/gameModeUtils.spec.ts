// Feature: game-modes-endless-and-loops, Property 1: filterLevel1Cards returns exactly the Level 1 cards
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { LOOP_COUNT, MAX_LEVEL, MIN_LEVEL } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'

import {
  avoidConsecutiveRepeat,
  endlessLevel5NextCard,
  endlessNextCard,
  filterBelowMaxLevel,
  filterLevel1Cards,
  handleNextCard,
  repeatCards
} from './gameModeUtils'

/**
 * Arbitrary: generates a BaseCard with level in [MIN_LEVEL, MAX_LEVEL]
 */
const baseCardArb = fc
  .record({
    level: fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
    time: fc.integer({ min: 1, max: 60 })
  })
  .map((r): BaseCard => r)

// **Validates: Requirements 3.1, 6.2**
describe('filterLevel1Cards — property tests', () => {
  it('returns exactly the Level 1 cards from any card array', () => {
    fc.assert(
      fc.property(fc.array(baseCardArb, { minLength: 0, maxLength: 50 }), cards => {
        const result = filterLevel1Cards(cards)

        // Every returned card must be Level 1
        for (const card of result) {
          expect(card.level).toBe(MIN_LEVEL)
        }

        // Every Level 1 card from the input must appear in the result
        const level1Input = cards.filter(c => c.level === MIN_LEVEL)
        expect(result).toHaveLength(level1Input.length)

        // The result should contain exactly the same cards (by reference) as the Level 1 input cards
        for (const [i, card] of level1Input.entries()) {
          expect(result[i]).toBe(card)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: game-modes-endless-and-loops, Property 3: repeatCards produces correct multiplied list
// **Validates: Requirements 5.1, 5.2, 6.3**
describe('repeatCards — property tests', () => {
  /**
   * Arbitrary: generates a card with a unique `id` so we can count occurrences
   * after shuffling (since repeatCards shuffles the result).
   */
  const idCardArb = fc.record({
    id: fc.uuid(),
    level: fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
    time: fc.integer({ min: 1, max: 60 })
  })

  it('produces a list of length cards.length × count with each card appearing exactly count times', () => {
    fc.assert(
      fc.property(
        fc.array(idCardArb, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (cards, count) => {
          const result = repeatCards(cards, count)

          // Length must equal cards.length × count
          expect(result).toHaveLength(cards.length * count)

          // Each original card must appear exactly `count` times (by reference)
          for (const card of cards) {
            const occurrences = result.filter(r => r === card).length
            expect(occurrences).toBe(count)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Unit tests for gameModeUtils edge cases
// Requirements: 1.2, 6.2, 6.3, 8.1, 8.2, 8.3

describe('filterLevel1Cards — unit tests', () => {
  it('returns empty array when given empty array', () => {
    expect(filterLevel1Cards([])).toEqual([])
  })

  it('returns empty array when no cards are Level 1', () => {
    const cards: BaseCard[] = [
      { level: 2, time: 10 },
      { level: 3, time: 20 },
      { level: 5, time: 5 }
    ]
    expect(filterLevel1Cards(cards)).toEqual([])
  })

  it('returns all cards when every card is Level 1', () => {
    const cards: BaseCard[] = [
      { level: MIN_LEVEL, time: 10 },
      { level: MIN_LEVEL, time: 20 },
      { level: MIN_LEVEL, time: 30 }
    ]
    const result = filterLevel1Cards(cards)
    expect(result).toHaveLength(3)
    for (const card of result) {
      expect(card.level).toBe(MIN_LEVEL)
    }
  })
})

describe('repeatCards — unit tests', () => {
  it('returns empty array when given empty array', () => {
    expect(repeatCards([], 3)).toEqual([])
  })

  it('throws when count is 0', () => {
    const cards: BaseCard[] = [{ level: 1, time: 10 }]
    expect(() => repeatCards(cards, 0)).toThrow('Invalid repeat count')
  })
})

describe('LOOP_COUNT constant', () => {
  it('equals 3', () => {
    expect(LOOP_COUNT).toBe(3)
  })
})

describe('TEXT_DE.shared.gameModes strings', () => {
  it('endlessLevel1 exists and is non-empty', () => {
    expect(TEXT_DE.shared.gameModes.endlessLevel1).toBeTruthy()
    expect(typeof TEXT_DE.shared.gameModes.endlessLevel1).toBe('string')
  })

  it('threeRounds exists and is non-empty', () => {
    expect(TEXT_DE.shared.gameModes.threeRounds).toBeTruthy()
    expect(typeof TEXT_DE.shared.gameModes.threeRounds).toBe('string')
  })

  it('noLevel1Cards exists and is non-empty', () => {
    expect(TEXT_DE.shared.gameModes.noLevel1Cards).toBeTruthy()
    expect(typeof TEXT_DE.shared.gameModes.noLevel1Cards).toBe('string')
  })
})

describe('avoidConsecutiveRepeat', () => {
  const getKey = (c: { id: string }) => c.id

  it('returns nextIndex unchanged when cards.length <= 1', () => {
    const cards = [{ id: 'a' }]
    expect(avoidConsecutiveRepeat(cards, 0, 'a', getKey)).toBe(0)
  })

  it('returns nextIndex when next card differs from previousKey', () => {
    const cards = [{ id: 'a' }, { id: 'b' }]
    expect(avoidConsecutiveRepeat(cards, 1, 'a', getKey)).toBe(1)
  })

  it('swaps when next card matches previousKey and a different card exists', () => {
    const cards = [{ id: 'a' }, { id: 'a' }, { id: 'b' }]
    const result = avoidConsecutiveRepeat(cards, 1, 'a', getKey)
    expect(result).toBe(1)
    expect(cards[1]?.id).toBe('b')
  })

  it('does not swap when all cards have the same key', () => {
    const cards = [{ id: 'a' }, { id: 'a' }, { id: 'a' }]
    const result = avoidConsecutiveRepeat(cards, 1, 'a', getKey)
    expect(result).toBe(1)
    expect(cards[1]?.id).toBe('a')
  })

  it('preserves total card count after swap', () => {
    const cards = [{ id: 'x' }, { id: 'x' }, { id: 'y' }, { id: 'z' }]
    const before = cards.map(c => c.id).sort((a, b) => a.localeCompare(b))
    avoidConsecutiveRepeat(cards, 1, 'x', getKey)
    const after = cards.map(c => c.id).sort((a, b) => a.localeCompare(b))
    expect(after).toEqual(before)
  })
})

describe('endlessNextCard', () => {
  it('removes a promoted card (level > MIN_LEVEL)', () => {
    const gameCards = {
      value: [
        { level: 2, time: 10 },
        { level: 1, time: 20 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const isOver = endlessNextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(1)
    expect(gameCards.value[0]?.level).toBe(1)
  })

  it('keeps a Level 1 card and advances index', () => {
    const gameCards = {
      value: [
        { level: 1, time: 10 },
        { level: 1, time: 20 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const isOver = endlessNextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(2)
    expect(currentCardIndex.value).toBe(1)
  })

  it('returns true when last card is removed', () => {
    const gameCards = { value: [{ level: 2, time: 10 }] }
    const currentCardIndex = { value: 0 }
    const isOver = endlessNextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(true)
    expect(gameCards.value).toHaveLength(0)
  })

  it('wraps index when advancing past end', () => {
    const gameCards = {
      value: [
        { level: 1, time: 10 },
        { level: 1, time: 20 }
      ]
    }
    const currentCardIndex = { value: 1 }
    const isOver = endlessNextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(currentCardIndex.value).toBe(0)
  })
})

describe('handleNextCard', () => {
  interface TestCard extends BaseCard {
    id: string
  }
  const getKey = (c: TestCard) => c.id

  it('delegates to baseNextCard in standard mode', () => {
    const gameCards = {
      value: [
        { id: 'a', level: 1, time: 10 },
        { id: 'b', level: 1, time: 10 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => {
      currentCardIndex.value++
      return currentCardIndex.value >= gameCards.value.length
    }

    const isOver = handleNextCard(gameCards, currentCardIndex, 'standard', baseNextCard, getKey)
    expect(isOver).toBe(false)
    expect(currentCardIndex.value).toBe(1)
  })

  it('returns true when baseNextCard signals game over in standard mode', () => {
    const gameCards = { value: [{ id: 'a', level: 1, time: 10 }] }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => {
      currentCardIndex.value++
      return true
    }

    const isOver = handleNextCard(gameCards, currentCardIndex, 'standard', baseNextCard, getKey)
    expect(isOver).toBe(true)
  })

  it('removes promoted card in endless-level1 mode', () => {
    const gameCards = {
      value: [
        { id: 'a', level: 2, time: 10 },
        { id: 'b', level: 1, time: 10 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => false

    const isOver = handleNextCard(
      gameCards,
      currentCardIndex,
      'endless-level1',
      baseNextCard,
      getKey
    )
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(1)
    expect(gameCards.value[0]?.id).toBe('b')
  })

  it('avoids consecutive repeat in 3-rounds mode', () => {
    const gameCards = {
      value: [
        { id: 'a', level: 1, time: 10 },
        { id: 'a', level: 1, time: 10 },
        { id: 'b', level: 1, time: 10 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => {
      currentCardIndex.value++
      return currentCardIndex.value >= gameCards.value.length
    }

    // Play card 'a' at index 0, then nextCard should swap if index 1 is also 'a'
    const isOver = handleNextCard(gameCards, currentCardIndex, '3-rounds', baseNextCard, getKey)
    expect(isOver).toBe(false)
    // After swap, the card at index 1 should be 'b'
    expect(gameCards.value[1]?.id).toBe('b')
  })
})

describe('filterBelowMaxLevel — unit tests', () => {
  it('returns empty array when given empty array', () => {
    expect(filterBelowMaxLevel([])).toEqual([])
  })

  it('returns empty array when all cards are at MAX_LEVEL', () => {
    const cards: BaseCard[] = [
      { level: MAX_LEVEL, time: 10 },
      { level: MAX_LEVEL, time: 20 }
    ]
    expect(filterBelowMaxLevel(cards)).toEqual([])
  })

  it('returns all cards when none are at MAX_LEVEL', () => {
    const cards: BaseCard[] = [
      { level: 1, time: 10 },
      { level: 2, time: 20 },
      { level: 4, time: 30 }
    ]
    expect(filterBelowMaxLevel(cards)).toHaveLength(3)
  })

  it('filters out only MAX_LEVEL cards', () => {
    const cards: BaseCard[] = [
      { level: 1, time: 10 },
      { level: MAX_LEVEL, time: 20 },
      { level: 3, time: 30 },
      { level: MAX_LEVEL, time: 40 }
    ]
    const result = filterBelowMaxLevel(cards)
    expect(result).toHaveLength(2)
    for (const card of result) {
      expect(card.level).toBeLessThan(MAX_LEVEL)
    }
  })
})

describe('filterBelowMaxLevel — property tests', () => {
  it('returns exactly the cards below MAX_LEVEL', () => {
    fc.assert(
      fc.property(fc.array(baseCardArb, { minLength: 0, maxLength: 50 }), cards => {
        const result = filterBelowMaxLevel(cards)

        // Every returned card must be below MAX_LEVEL
        for (const card of result) {
          expect(card.level).toBeLessThan(MAX_LEVEL)
        }

        // Every card below MAX_LEVEL from the input must appear in the result
        const belowMaxInput = cards.filter(c => c.level < MAX_LEVEL)
        expect(result).toHaveLength(belowMaxInput.length)
      }),
      { numRuns: 100 }
    )
  })
})

describe('endlessLevel5NextCard', () => {
  it('removes a card at MAX_LEVEL', () => {
    const gameCards = {
      value: [
        { level: MAX_LEVEL, time: 10 },
        { level: 3, time: 20 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const isOver = endlessLevel5NextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(1)
    expect(gameCards.value[0]?.level).toBe(3)
  })

  it('keeps a card below MAX_LEVEL and advances index', () => {
    const gameCards = {
      value: [
        { level: 3, time: 10 },
        { level: 4, time: 20 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const isOver = endlessLevel5NextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(2)
    expect(currentCardIndex.value).toBe(1)
  })

  it('returns true when last card is removed', () => {
    const gameCards = { value: [{ level: MAX_LEVEL, time: 10 }] }
    const currentCardIndex = { value: 0 }
    const isOver = endlessLevel5NextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(true)
    expect(gameCards.value).toHaveLength(0)
  })

  it('wraps index when advancing past end', () => {
    const gameCards = {
      value: [
        { level: 3, time: 10 },
        { level: 4, time: 20 }
      ]
    }
    const currentCardIndex = { value: 1 }
    const isOver = endlessLevel5NextCard(gameCards, currentCardIndex)
    expect(isOver).toBe(false)
    expect(currentCardIndex.value).toBe(0)
  })

  it('does not remove a card at level 4 (below MAX_LEVEL)', () => {
    const gameCards = {
      value: [
        { level: 4, time: 10 },
        { level: 2, time: 20 }
      ]
    }
    const currentCardIndex = { value: 0 }
    endlessLevel5NextCard(gameCards, currentCardIndex)
    expect(gameCards.value).toHaveLength(2)
    expect(currentCardIndex.value).toBe(1)
  })
})

describe('handleNextCard — endless-level5 mode', () => {
  interface TestCard extends BaseCard {
    id: string
  }
  const getKey = (c: TestCard) => c.id

  it('removes card at MAX_LEVEL in endless-level5 mode', () => {
    const gameCards = {
      value: [
        { id: 'a', level: MAX_LEVEL, time: 10 },
        { id: 'b', level: 3, time: 10 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => false

    const isOver = handleNextCard(
      gameCards,
      currentCardIndex,
      'endless-level5',
      baseNextCard,
      getKey
    )
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(1)
    expect(gameCards.value[0]?.id).toBe('b')
  })

  it('keeps card below MAX_LEVEL in endless-level5 mode', () => {
    const gameCards = {
      value: [
        { id: 'a', level: 4, time: 10 },
        { id: 'b', level: 3, time: 10 }
      ]
    }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => false

    const isOver = handleNextCard(
      gameCards,
      currentCardIndex,
      'endless-level5',
      baseNextCard,
      getKey
    )
    expect(isOver).toBe(false)
    expect(gameCards.value).toHaveLength(2)
    expect(currentCardIndex.value).toBe(1)
  })

  it('returns true when all cards reach MAX_LEVEL in endless-level5', () => {
    const gameCards = { value: [{ id: 'a', level: MAX_LEVEL, time: 10 }] }
    const currentCardIndex = { value: 0 }
    const baseNextCard = () => false

    const isOver = handleNextCard(
      gameCards,
      currentCardIndex,
      'endless-level5',
      baseNextCard,
      getKey
    )
    expect(isOver).toBe(true)
    expect(gameCards.value).toHaveLength(0)
  })
})

describe('TEXT_DE.shared.gameModes — endless-level5 strings', () => {
  it('endlessLevel5 exists and is non-empty', () => {
    expect(TEXT_DE.shared.gameModes.endlessLevel5).toBeTruthy()
    expect(typeof TEXT_DE.shared.gameModes.endlessLevel5).toBe('string')
  })

  it('noCardsBelow5 exists and is non-empty', () => {
    expect(TEXT_DE.shared.gameModes.noCardsBelow5).toBeTruthy()
    expect(typeof TEXT_DE.shared.gameModes.noCardsBelow5).toBe('string')
  })
})
