import type { FocusType } from '@flashcards/shared'
import { filterByLevels, selectCardsByFocus } from '@flashcards/shared'

import { getDifficultyFromQuestion, getOperationFromQuestion } from '@/services/storage'
import type { Card, GameSettings } from '@/types'

/**
 * Filter cards by selected operations AND difficulties (intersection),
 * then by selected card levels.
 */
export function filterCards(cards: Card[], settings: GameSettings): Card[] {
  const opSet = new Set(settings.operations)
  const diffSet = new Set(settings.difficulties)

  const selected = cards.filter(card => {
    const op = getOperationFromQuestion(card.question)
    const diff = getDifficultyFromQuestion(card.question)
    return opSet.has(op) && diffSet.has(diff)
  })
  return filterByLevels(selected, settings.levels)
}

/**
 * Select cards for a game round based on focus strategy.
 * Delegates to shared focus-weighted selection algorithm from @flashcards/shared.
 */
export function selectCardsForRound(cards: Card[], focus: FocusType, count: number): Card[] {
  return selectCardsByFocus({
    cards,
    focus,
    maxCards: count
  })
}
