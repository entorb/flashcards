import type { FocusType } from '@flashcards/shared'
import { shuffleArray, weightedRandomSelection } from '@flashcards/shared/utils'

import { LEVEL_BONUS_NUMERATOR, ROUND_SIZE } from '../constants'
import type { Card, GameMode } from '../types'

/**
 * Select cards for a game round based on focus strategy
 */
export function selectCardsForRound(allCards: Card[], focus: FocusType, mode: GameMode): Card[] {
  if (allCards.length === 0) {
    return []
  }

  // For 'slow' focus, sort by time descending based on mode
  if (focus === 'slow') {
    const sortedByTime = [...allCards].sort((a, b) => {
      let timeA: number
      let timeB: number

      if (mode === 'blind') {
        timeA = a.time_blind
        timeB = b.time_blind
      } else if (mode === 'typing') {
        timeA = a.time_typing
        timeB = b.time_typing
      } else {
        // For multiple-choice, use min of both times (since it doesn't track its own time)
        timeA = Math.min(a.time_blind, a.time_typing)
        timeB = Math.min(b.time_blind, b.time_typing)
      }

      return timeB - timeA
    })
    const cardsToSelect = Math.min(ROUND_SIZE, allCards.length)
    return shuffleArray(sortedByTime.slice(0, cardsToSelect))
  }

  // Calculate weights for each card based on focus type
  const weightedCards = allCards.map(card => {
    let weight = 1 // Default weight for all cards

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
    }

    return { item: card, weight }
  })

  const cardsToSelect = Math.min(ROUND_SIZE, allCards.length)

  // Use shared weighted random selection utility
  const selectedCards = weightedRandomSelection(weightedCards, cardsToSelect)

  // Shuffle the selected cards
  return shuffleArray(selectedCards)
}
