import { MIN_LEVEL } from '../constants.js'
import type { BaseCard, SessionMode } from '../types.js'

import { shuffleArray } from './cardSelection.js'

/**
 * Filter cards at Level 1 from any card array
 */
export function filterLevel1Cards<T extends BaseCard>(cards: T[]): T[] {
  return cards.filter(card => card.level === MIN_LEVEL)
}

/**
 * Create a repeated card list for 3-rounds mode, shuffled
 */
export function repeatCards<T>(cards: T[], count: number): T[] {
  const repeated: T[] = []
  for (let i = 0; i < count; i++) {
    repeated.push(...cards)
  }
  return shuffleArray(repeated)
}

/**
 * Avoid showing the same card twice in a row by swapping cards in the array.
 * If the card at `nextIndex` has the same key as `previousKey`, find the nearest
 * card with a different key (searching forward) and swap it into `nextIndex`.
 * This ensures no cards are skipped — only reordered.
 *
 * For endless mode (wrapping arrays), the caller should pass the mutable array.
 * For 3-rounds mode (sequential arrays), swapping preserves total card count.
 */
export function avoidConsecutiveRepeat<T>(
  cards: T[],
  nextIndex: number,
  previousKey: string,
  getKey: (card: T) => string
): number {
  if (cards.length <= 1) return nextIndex
  const nextCard = cards[nextIndex]
  if (nextCard !== undefined && getKey(nextCard) === previousKey) {
    // Search forward for a card with a different key to swap with
    for (let offset = 1; offset < cards.length; offset++) {
      const swapIndex = (nextIndex + offset) % cards.length
      const swapCard = cards[swapIndex]
      const currentCard = cards[nextIndex]
      if (swapCard !== undefined && currentCard !== undefined && getKey(swapCard) !== previousKey) {
        // Swap the cards in-place
        cards[nextIndex] = swapCard
        cards[swapIndex] = currentCard
        break
      }
    }
  }
  return nextIndex
}

/**
 * Endless mode nextCard logic: remove correctly answered cards, keep incorrect ones.
 * Returns true if the game is over (no cards left).
 */
export function endlessNextCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number }
): boolean {
  const currentIdx = currentCardIndex.value
  const card = gameCards.value[currentIdx]
  if (card && card.level > MIN_LEVEL) {
    // Card was promoted (correct answer) — remove it
    gameCards.value = gameCards.value.filter((_, i) => i !== currentIdx)
    if (currentCardIndex.value >= gameCards.value.length) {
      currentCardIndex.value = 0
    }
  } else {
    // Card stays (incorrect answer) — move to next
    currentCardIndex.value++
    if (currentCardIndex.value >= gameCards.value.length) {
      currentCardIndex.value = 0
    }
  }
  return gameCards.value.length === 0
}

/**
 * Shared nextCard logic for all game modes with avoid-consecutive-repeat.
 * Encapsulates the common pattern used across 1x1, voc, and lwk apps.
 *
 * @param gameCards - reactive ref to the game cards array
 * @param currentCardIndex - reactive ref to the current card index
 * @param sessionMode - current session mode
 * @param baseNextCard - the base store's nextCard function
 * @param getKey - function to extract the unique identity key from a card
 * @returns true if the game is over
 */
export function handleNextCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number },
  sessionMode: SessionMode,
  baseNextCard: () => boolean,
  getKey: (card: T) => string
): boolean {
  const previousCard = gameCards.value[currentCardIndex.value]
  const previousKey = previousCard !== undefined ? getKey(previousCard) : ''

  if (sessionMode === 'endless-level1') {
    const isGameOver = endlessNextCard(gameCards, currentCardIndex)

    currentCardIndex.value = avoidConsecutiveRepeat(
      gameCards.value,
      currentCardIndex.value,
      previousKey,
      getKey
    )

    return isGameOver
  }

  // Standard and 3-rounds: use base nextCard
  const isGameOver = baseNextCard()
  if (!isGameOver && sessionMode === '3-rounds') {
    currentCardIndex.value = avoidConsecutiveRepeat(
      gameCards.value,
      currentCardIndex.value,
      previousKey,
      getKey
    )
  }
  return isGameOver
}
