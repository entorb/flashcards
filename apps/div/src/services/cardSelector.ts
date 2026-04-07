import type { FocusType } from '@flashcards/shared'
import { selectCardsByFocus } from '@flashcards/shared'

import { parseCardQuestion } from '@/services/storage'
import type { Card } from '@/types'

/**
 * Filter cards where the divisor matches any number in the selection
 * The divisor is the number after ':' in the question string (e.g., "18:3" → divisor is 3)
 */
export function filterCardsByDivisor(cards: Card[], selection: number[]): Card[] {
  const selectSet = new Set(selection)
  return cards.filter(card => {
    const { divisor } = parseCardQuestion(card.question)
    return selectSet.has(divisor)
  })
}

/**
 * Select cards for a game round based on focus strategy
 * Delegates to shared focus-weighted selection algorithm from @flashcards/shared
 */
export function selectCardsForRound(cards: Card[], focus: FocusType, count: number): Card[] {
  return selectCardsByFocus({
    cards,
    focus,
    maxCards: count
  })
}
