import type { FocusType } from '@flashcards/shared'
import { LEVEL_BONUS_NUMERATOR } from '@flashcards/shared'
import { weightedRandomSelection } from '@flashcards/shared/utils'

import { parseCardQuestion } from '@/services/storage'
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
export function selectCardsForRound(cards: Card[], focus: FocusType, count: number): Card[] {
  // Calculate weights for each card based on focus type
  const weightedCards = cards.map(card => {
    let weight: number

    if (focus === 'weak') {
      // Prioritize lower level cards (weaker)
      // Level 1 = 5x weight, Level 5 = 1x weight
      weight = LEVEL_BONUS_NUMERATOR - card.level
    } else if (focus === 'strong') {
      // Prioritize higher level cards (stronger)
      // Level 1 = 1x weight, Level 5 = 5x weight
      weight = card.level
    } else if (focus === 'medium') {
      // Medium levels: 1->1, 2->3, 3->5, 4->3, 5->1
      const mediumWeights = [1, 3, 5, 3, 1]
      weight = mediumWeights[card.level - 1]
    } else {
      // slow: prioritize cards with higher time (slower)
      weight = card.time
    }

    return { item: card, weight }
  })

  // Use shared weighted random selection utility
  return weightedRandomSelection(weightedCards, count)
}
