/**
 * LWK App - Card Selection Service
 * Handles selection of cards for game sessions based on focus settings
 */

import type { FocusType } from '@flashcards/shared'
import { selectCardsByFocus } from '@flashcards/shared'
import { shuffleArray } from '@flashcards/shared/utils'

import { MAX_CARDS_PER_GAME } from '../constants'
import type { Card, GameMode } from '../types'

/**
 * Select cards for a game session based on mode and focus
 * Uses shared focus-weighted selection algorithm
 */
export function selectCards(allCards: Card[], mode: GameMode, focus: FocusType): Card[] {
  // Filter cards based on mode
  const modeFilter = (card: Card) => {
    // Copy mode: only cards with level < 3
    if (mode === 'copy') {
      return card.level < 3
    }
    return true
  }

  // Use shared selection with mode filtering
  const selectedCards = selectCardsByFocus({
    cards: allCards,
    focus,
    maxCards: MAX_CARDS_PER_GAME,
    modeFilter,
    timeExtractor: (card: Card) => card.time
  })

  return shuffleArray(selectedCards)
}
