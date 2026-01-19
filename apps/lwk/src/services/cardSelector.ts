/**
 * LWK App - Card Selection Service
 * Handles selection of cards for game sessions based on focus settings
 */

import type { FocusType } from '@flashcards/shared'
import { LEVEL_BONUS_NUMERATOR } from '@flashcards/shared'
import { shuffleArray, weightedRandomSelection } from '@flashcards/shared/utils'

import { MAX_CARDS_PER_GAME } from '../constants'
import type { Card, GameMode } from '../types'

/**
 * Select cards for a game session based on mode and focus
 */
export function selectCards(allCards: Card[], mode: GameMode, focus: FocusType): Card[] {
  // Filter cards based on mode
  let eligibleCards = allCards

  // Copy mode: only cards with level < 3
  if (mode === 'copy') {
    eligibleCards = allCards.filter(card => card.level < 3)
  }

  if (eligibleCards.length === 0) {
    return []
  }

  // For 'slow' focus, prefer higher time values
  if (focus === 'slow') {
    const sortedByTime = [...eligibleCards].sort((a, b) => b.time - a.time)
    const cardsToSelect = Math.min(MAX_CARDS_PER_GAME, sortedByTime.length)
    return shuffleArray(sortedByTime.slice(0, cardsToSelect))
  }

  // Calculate weights for each card based on focus type
  const weightedCards = eligibleCards.map(card => {
    let weight = 1

    if (focus === 'weak') {
      weight = LEVEL_BONUS_NUMERATOR - card.level
    } else if (focus === 'strong') {
      weight = card.level
    } else if (focus === 'medium') {
      const mediumWeights = [1, 3, 5, 3, 1]
      weight = mediumWeights[card.level - 1]
    }

    return { item: card, weight }
  })

  const cardsToSelect = Math.min(MAX_CARDS_PER_GAME, eligibleCards.length)
  const selectedCards = weightedRandomSelection(weightedCards, cardsToSelect)
  return shuffleArray(selectedCards)
}
