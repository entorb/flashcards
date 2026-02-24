// Feature: game-modes-endless-and-loops, Property 2
// **Validates: Requirements 3.2, 3.3**
import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MIN_LEVEL } from '@flashcards/shared'

import type { Card } from '@/types'

/**
 * Helper: create a Level 1 card with a given question string.
 * All endless-level1 cards start at MIN_LEVEL.
 */
function makeLevel1Card(question: string): Card {
  return { question, answer: 0, level: MIN_LEVEL, time: 60 }
}

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
})

/**
 * Setup mocks for endless mode property tests.
 * The updateCard mock mutates the in-memory card's level so that
 * nextCard can detect whether the answer was correct (card.level > MIN_LEVEL).
 */
async function setupEndlessMocks(cards: Card[]) {
  // Build a map so updateCard can mutate in-memory card levels
  const cardMap = new Map<string, Card>()
  for (const c of cards) {
    cardMap.set(c.question, c)
  }

  vi.doMock('@/services/storage', () => ({
    loadCards: vi.fn(() => cards),
    loadHistory: vi.fn(() => []),
    saveHistory: vi.fn(),
    loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
    saveGameStats: vi.fn(),
    getGameConfig: vi.fn(() => null),
    setGameConfig: vi.fn(),
    loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    loadGameState: vi.fn(() => null),
    setGameResult: vi.fn(),
    updateCard: vi.fn((question: string, updates: Partial<Card>) => {
      const card = cardMap.get(question)
      if (card && updates.level !== undefined) {
        card.level = updates.level
      }
    }),
    resetCards: vi.fn(),
    getVirtualCardsForRange: vi.fn(() => [...cards]),
    initializeCards: vi.fn(),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
    getGameResult: vi.fn(() => null),
    clearGameResult: vi.fn(),
    parseCardQuestion: vi.fn((question: string) => {
      const [yStr, xStr] = question.split('x')
      return {
        y: Number.parseInt(yStr ?? '', 10) || 0,
        x: Number.parseInt(xStr ?? '', 10) || 0
      }
    })
  }))

  vi.doMock('@/services/cardSelector', () => ({
    filterCardsAll: vi.fn(() => [...cards]),
    filterCardsBySelection: vi.fn(() => [...cards]),
    filterCardsSquares: vi.fn(() => [...cards]),
    selectCardsForRound: vi.fn((c: Card[]) => c)
  }))

  const { useGameStore } = await import('./useGameStore')
  return useGameStore()
}

/**
 * Arbitrary: generates an array of 1–20 unique Level 1 cards.
 */
const level1CardsArb = fc
  .integer({ min: 1, max: 20 })
  .map(n => Array.from({ length: n }, (_, i) => makeLevel1Card(`${i + 3}x${i + 3}`)))

describe('useGameStore - Endless mode correct/incorrect card removal (Property 2)', () => {
  it(
    'correct answer removes the answered card, reducing count by 1',
    { timeout: 30_000 },
    async () => {
      await fc.assert(
        fc.asyncProperty(level1CardsArb, async cards => {
          vi.resetModules()
          const store = await setupEndlessMocks(cards)

          store.startGame({ select: 'all', focus: 'medium' }, 'endless-level1', true)

          const countBefore = store.gameCards.value.length
          expect(countBefore).toBe(cards.length)

          const answeredCard = store.currentCard.value
          expect(answeredCard).not.toBeNull()

          // Answer correctly — card level gets promoted via mock updateCard
          store.handleAnswer('correct', 5)

          // nextCard should detect the promoted card and remove it
          store.nextCard()

          expect(store.gameCards.value).toHaveLength(countBefore - 1)
          // The removed card should no longer be in gameCards
          const remaining = store.gameCards.value.map(c => c.question)
          expect(remaining).not.toContain(answeredCard?.question)
        }),
        { numRuns: 100 }
      )
    }
  )

  it('incorrect answer keeps the card, count stays the same', async () => {
    await fc.assert(
      fc.asyncProperty(level1CardsArb, async cards => {
        vi.resetModules()
        const store = await setupEndlessMocks(cards)

        store.startGame({ select: 'all', focus: 'medium' }, 'endless-level1', true)

        const countBefore = store.gameCards.value.length
        expect(countBefore).toBe(cards.length)

        const answeredCard = store.currentCard.value
        expect(answeredCard).not.toBeNull()

        // Answer incorrectly — card stays at MIN_LEVEL
        store.handleAnswer('incorrect', 5)

        // nextCard should keep the card
        store.nextCard()

        expect(store.gameCards.value).toHaveLength(countBefore)
        // The card should still be in gameCards
        const remaining = store.gameCards.value.map(c => c.question)
        expect(remaining).toContain(answeredCard?.question)
      }),
      { numRuns: 100 }
    )
  })
})
