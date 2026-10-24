import { MAX_LEVEL, MIN_LEVEL } from "../constants.js"
import type { BaseCard, SessionMode } from "../types.js"

import { shuffleArray } from "./cardSelection.js"

/**
 * Check if a session mode is an endless mode (cards are removed as they're mastered)
 */
export function isEndlessMode(mode: SessionMode): boolean {
  return mode === "endless-level1" || mode === "endless-level5" || mode === "all-correct"
}

/**
 * Filter cards at Level 1 from any card array
 */
export function filterLevel1Cards<T extends BaseCard>(cards: T[]): T[] {
  return cards.filter((card) => card.level === MIN_LEVEL)
}

/**
 * Filter cards below MAX_LEVEL (level < 5) from any card array
 */
export function filterBelowMaxLevel<T extends BaseCard>(cards: T[]): T[] {
  return cards.filter((card) => card.level < MAX_LEVEL)
}

/**
 * Filter cards whose level is one of the selected levels (empty selection matches nothing)
 */
export function filterByLevels<T extends BaseCard>(cards: T[], levels: number[]): T[] {
  if (levels.length === 0) return []
  const levelSet = new Set(levels)
  return cards.filter((card) => levelSet.has(card.level))
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

/** Number of most recently shown cards that should not be picked again if avoidable */
const AVOID_RECENT_COUNT = 2

/**
 * Pick the index of the next card, starting from the random index `startIndex`.
 * Searches `[from, cards.length)` cyclically for the first card whose key is not in
 * `avoidKeys` (most recent first). If none exists, falls back to any card that
 * differs from the most recent one, and finally to `startIndex`.
 */
export function pickIndexAvoiding<T>(
  cards: T[],
  from: number,
  startIndex: number,
  avoidKeys: string[],
  getKey: (card: T) => string,
): number {
  const span = cards.length - from
  const candidates: number[] = []
  for (let offset = 0; offset < span; offset++) {
    candidates.push(from + ((startIndex - from + offset) % span))
  }
  const keyAt = (i: number) => {
    const card = cards[i]
    return card === undefined ? "" : getKey(card)
  }
  const notRecent = candidates.find((i) => !avoidKeys.includes(keyAt(i)))
  if (notRecent !== undefined) return notRecent
  return candidates.find((i) => keyAt(i) !== avoidKeys[0]) ?? startIndex
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
  avoidKeys: string[],
  getKey: (card: T) => string,
  lastCorrect: boolean,
): boolean {
  const currentCard = gameCards.value[currentCardIndex.value]
  let mastered = currentCard !== undefined && currentCard.level >= MAX_LEVEL
  if (sessionMode === "endless-level1") {
    mastered = currentCard !== undefined && currentCard.level > MIN_LEVEL
  } else if (sessionMode === "all-correct") {
    // level can't tell "answered correctly" (level 1 stays 1 when wrong, 5 stays 5 when right)
    mastered = currentCard !== undefined && lastCorrect
  }
  if (mastered) {
    // Card was mastered (correct answer) — remove it
    gameCards.value = gameCards.value.filter((_, i) => i !== currentCardIndex.value)
  }
  if (gameCards.value.length === 0) return true

  // Game randomness only, no security requirement
  const randomIndex = Math.floor(Math.random() * gameCards.value.length) // NOSONAR typescript:S2245
  currentCardIndex.value = pickIndexAvoiding(gameCards.value, 0, randomIndex, avoidKeys, getKey)

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
  avoidKeys: string[],
  getKey: (card: T) => string,
): boolean {
  const nextIndex = currentCardIndex.value + 1
  if (nextIndex >= gameCards.value.length) return true

  // Game randomness only, no security requirement
  const randomIndex = nextIndex + Math.floor(Math.random() * (gameCards.value.length - nextIndex)) // NOSONAR typescript:S2245
  const pickIndex = pickIndexAvoiding(gameCards.value, nextIndex, randomIndex, avoidKeys, getKey)

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
 * @param lastCorrect - whether the current card was just answered correctly (all-correct mode)
 * @param recentKeys - mutable history of recently shown card keys (most recent first), kept by the caller
 * @returns true if the game is over
 */
export function handleNextCard<T extends BaseCard>(
  gameCards: { value: T[] },
  currentCardIndex: { value: number },
  sessionMode: SessionMode,
  getKey: (card: T) => string,
  lastCorrect = false,
  recentKeys: string[] = [],
): boolean {
  const previousCard = gameCards.value[currentCardIndex.value]
  if (previousCard !== undefined) {
    recentKeys.unshift(getKey(previousCard))
    recentKeys.length = Math.min(recentKeys.length, AVOID_RECENT_COUNT)
  }

  if (isEndlessMode(sessionMode)) {
    return nextEndlessCard(
      gameCards,
      currentCardIndex,
      sessionMode,
      recentKeys,
      getKey,
      lastCorrect,
    )
  }

  return nextRandomUnplayedCard(gameCards, currentCardIndex, recentKeys, getKey)
}
