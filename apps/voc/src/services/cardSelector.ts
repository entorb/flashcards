import type { FocusType } from "@flashcards/shared"
import { selectCardsByFocus } from "@flashcards/shared"
import { shuffleArray } from "@flashcards/shared/utils"

import { MAX_CARDS_PER_GAME } from "../constants.ts"
import type { Card } from "../types.ts"

/**
 * Select cards for a game round based on focus strategy
 * Handles mode-specific time extraction for voc app
 */
export function selectCardsForRound(allCards: Card[], focus: FocusType): Card[] {
  if (allCards.length === 0) {
    return []
  }

  // Use shared selection with voc-specific time extractor
  const selectedCards = selectCardsByFocus({
    cards: allCards,
    focus,
    maxCards: MAX_CARDS_PER_GAME,
    timeExtractor: (card: Card) => card.time,
  })

  // Shuffle the selected cards
  return shuffleArray(selectedCards)
}
