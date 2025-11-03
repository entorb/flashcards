import type { FocusType } from '@flashcards/shared'
import { weightedRandomSelection } from '@flashcards/shared/utils'

import { parseCardQuestion } from './storage'

import { MAX_CARD_LEVEL } from '@/constants'
import type { Card } from '@/types'

/**
 * Filter cards by selection (number array)
 * Cards where x OR y matches any number in the selection
 * Both x and y must be within the allowed range
 */
export function filterCardsBySelection(
  cards: Card[],
  selection: number[],
  range: Set<number>
): Card[] {
  const selectSet = new Set(selection)
  return cards.filter(card => {
    const { x, y } = parseCardQuestion(card.question)
    return (selectSet.has(x) || selectSet.has(y)) && range.has(x) && range.has(y)
  })
}

/**
 * Filter cards for x² (squares only)
 * Returns cards where x === y within the range
 */
export function filterCardsSquares(cards: Card[], range: Set<number>): Card[] {
  return cards.filter(card => {
    const { x, y } = parseCardQuestion(card.question)
    return x === y && range.has(x)
  })
}

/**
 * Filter all cards within the range
 * Both x and y must be in range
 */
export function filterCardsAll(cards: Card[], range: Set<number>): Card[] {
  return cards.filter(card => {
    const { x, y } = parseCardQuestion(card.question)
    return range.has(x) && range.has(y)
  })
}

/**
 * Select cards for a game round based on focus strategy
 */
export function selectCards(cards: Card[], focus: FocusType, count: number): Card[] {
  // Calculate weights for each card based on focus type
  const weightedCards = cards.map(card => {
    let weight: number

    if (focus === 'weak') {
      // Level 1=highest weight, Level 5=lowest weight
      weight = MAX_CARD_LEVEL + 1 - card.level
    } else if (focus === 'strong') {
      // Level 5=highest weight, Level 1=lowest weight
      weight = card.level
    } else {
      // slow: prioritize cards with higher time (slower)
      weight = card.time
    }

    return { item: card, weight }
  })

  // Use shared weighted random selection utility
  return weightedRandomSelection(weightedCards, count)
}
