import { MAX_LEVEL, MIN_LEVEL } from '../constants.js'
import type { BaseCard, SessionMode } from '../types.js'

import { shuffleArray } from './cardSelection.js'

/**
 * Check if a session mode is an endless mode (cards are removed as they're mastered)
 */
export function isEndlessMode(mode: SessionMode): boolean {
  return mode === 'endless-level1' || mode === 'endless-level5'
}

/**
 * Filter cards at Level 1 from any card array
 */
export function filterLevel1Cards<T extends BaseCard>(cards: T[]): T[] {
  return cards.filter(card => card.level === MIN_LEVEL)
}

/**
 * Filter cards below MAX_LEVEL (level < 5) from any card array
 */
export function filterBelowMaxLevel<T extends BaseCard>(cards: T[]): T[] {
  return cards.filter(card => card.level < MAX_LEVEL)
}

/**
 * Filter cards whose level is one of the selected levels (empty selection matches nothing)
 */
export function filterByLevels<T extends BaseCard>(cards: T[], levels: number[]): T[] {
  if (levels.length === 0) return []
  const levelSet = new Set(levels)
  return cards.filter(card => levelSet.has(card.level))
}

/**
 * Create a repeated card list for 3-rounds mode.
 * Each round is shuffled independently so the card order differs per round.
 */
export function repeatCards<T>(cards: T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid repeat count: ${count} (expected positive integer)`)
  }
  const repeated: T[] = []
  for (let i = 0; i < count; i++) {
    repeated.push(...shuffleArray(cards))
  }
  return repeated
}

/**
 * Avoid showing the same card twice in a row by swapping cards in the array.
 * If the card at `nextIndex` has the same key as `previousKey`, find the nearest
 * card with a different key (searching forward) and swap it into `nextIndex`.
 * This ensures no cards are skipped — only reordered.
 *
 * For endless mode (shrinking pools), the caller should pass the mutable array.
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
 * Endless modes nextCard logic: remove the current card if it was mastered,
 * then pick a random remaining card.
 * Returns true if the game is over (no cards left).
 */
function nextEndlessCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number },
  sessionMode: SessionMode,
  previousKey: string,
  getKey: (card: T) => string
): boolean {
  const currentCard = gameCards.value[currentCardIndex.value]
  const mastered =
    sessionMode === 'endless-level1'
      ? currentCard !== undefined && currentCard.level > MIN_LEVEL
      : currentCard !== undefined && currentCard.level >= MAX_LEVEL
  if (mastered) {
    // Card was mastered (correct answer) — remove it
    gameCards.value = gameCards.value.filter((_, i) => i !== currentCardIndex.value)
  }
  if (gameCards.value.length === 0) return true

  currentCardIndex.value = Math.floor(Math.random() * gameCards.value.length)
  currentCardIndex.value = avoidConsecutiveRepeat(
    gameCards.value,
    currentCardIndex.value,
    previousKey,
    getKey
  )

  // When only one unmastered card remains, the same object reference is picked
  // again. UI watchers that key on card identity (e.g. `watch(currentCard)`)
  // compare by reference and would not fire, leaving the game stuck on the
  // previous answer. Replace the picked card with a fresh copy to force a reset.
  if (gameCards.value[currentCardIndex.value] === currentCard) {
    gameCards.value = gameCards.value.map((c, i) => (i === currentCardIndex.value ? { ...c } : c))
  }
  return false
}

/**
 * Standard & 3-rounds nextCard logic: pick a random unplayed card and swap it
 * into the next position, so each card is shown exactly once while
 * `currentCardIndex` stays a monotonic progress counter.
 * Returns true when all cards were shown.
 */
function nextRandomUnplayedCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number },
  previousKey: string,
  getKey: (card: T) => string
): boolean {
  const nextIndex = currentCardIndex.value + 1
  if (nextIndex >= gameCards.value.length) return true

  let pickIndex = nextIndex + Math.floor(Math.random() * (gameCards.value.length - nextIndex))
  const pickedCard = gameCards.value[pickIndex]
  if (pickedCard !== undefined && getKey(pickedCard) === previousKey) {
    // Avoid an immediate repeat if another card is available
    for (let i = nextIndex + 1; i < gameCards.value.length; i++) {
      const candidate = gameCards.value[i]
      if (candidate !== undefined && getKey(candidate) !== previousKey) {
        pickIndex = i
        break
      }
    }
  }

  const finalPick = gameCards.value[pickIndex]
  const nextSlot = gameCards.value[nextIndex]
  if (finalPick !== undefined && nextSlot !== undefined) {
    gameCards.value[pickIndex] = nextSlot
    gameCards.value[nextIndex] = finalPick
  }
  currentCardIndex.value = nextIndex
  return false
}

/**
 * Shared nextCard logic for all game modes: always pick a random card from the
 * cards selected for the current game.
 *
 * - standard & 3-rounds: fixed-length deck, each card shown exactly once.
 * - endless-level1 / endless-level5: the pool shrinks as cards are mastered.
 *
 * @param gameCards - reactive ref to the game cards array
 * @param currentCardIndex - reactive ref to the current card index
 * @param sessionMode - current session mode
 * @param getKey - function to extract the unique identity key from a card
 * @returns true if the game is over
 */
export function handleNextCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number },
  sessionMode: SessionMode,
  getKey: (card: T) => string
): boolean {
  const previousCard = gameCards.value[currentCardIndex.value]
  const previousKey = previousCard === undefined ? '' : getKey(previousCard)

  if (sessionMode === 'endless-level1' || sessionMode === 'endless-level5') {
    return nextEndlessCard(gameCards, currentCardIndex, sessionMode, previousKey, getKey)
  }

  return nextRandomUnplayedCard(gameCards, currentCardIndex, previousKey, getKey)
}
