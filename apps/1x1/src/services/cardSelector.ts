import type { FocusType } from "@flashcards/shared"
import { selectCardsByFocus } from "@flashcards/shared"

import { parseCardQuestion } from "@/services/storage"
import type { Card, SelectionType } from "@/types"

/**
 * Filter cards by selection (number array)
 * Cards where x OR y matches any number in the selection
 * Both x and y must be within the allowed range
 * Squares (x === y) are included as well when requested
 */
export function filterCardsBySelection(
  cards: Card[],
  selection: number[],
  range: Set<number>,
  includeSquares = false,
): Card[] {
  const selectSet = new Set(selection)
  return cards.filter((card) => {
    const { x, y } = parseCardQuestion(card.question)
    const matchesTable = selectSet.has(x) || selectSet.has(y)
    return (matchesTable || (includeSquares && x === y)) && range.has(x) && range.has(y)
  })
}

/**
 * Filter cards for x² (squares only)
 * Returns cards where x === y within the range
 */
export function filterCardsSquares(cards: Card[], range: Set<number>): Card[] {
  return cards.filter((card) => {
    const { x, y } = parseCardQuestion(card.question)
    return x === y && range.has(x)
  })
}

/**
 * Filter all cards within the range
 * Both x and y must be in range
 */
export function filterCardsAll(cards: Card[], range: Set<number>): Card[] {
  return cards.filter((card) => {
    const { x, y } = parseCardQuestion(card.question)
    return range.has(x) && range.has(y)
  })
}

/**
 * Filter cards for a game based on the user's selection and the x² toggle
 */
export function filterCardsBySettings(
  cards: Card[],
  select: SelectionType,
  squares: boolean,
  range: Set<number>,
): Card[] {
  if (select === "all") {
    return filterCardsAll(cards, range)
  }
  if (select === "x²") {
    return filterCardsSquares(cards, range)
  }
  return filterCardsBySelection(cards, select, range, squares)
}

/**
 * Select cards for a game round based on focus strategy
 * Uses shared focus-weighted selection algorithm from @flashcards/shared
 */
export function selectCardsForRound(cards: Card[], focus: FocusType, count: number): Card[] {
  return selectCardsByFocus({
    cards,
    focus,
    maxCards: count,
  })
}
