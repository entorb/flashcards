// Feature: game-modes-endless-and-loops, Property 4
// **Validates: Requirements 5.4**
import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LOOP_COUNT, calculatePointsBreakdown, MAX_TIME } from '@flashcards/shared'

import type { Card } from '@/types'

/**
 * Helper: create a card with a given question string and level.
 */
function makeCard(question: string, level: number): Card {
  return { question, answer: 0, level, time: MAX_TIME }
}

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
})

/**
 * Setup mocks for 3-rounds mode property tests.
 * The updateCard mock mutates the in-memory card's level so that
 * scoring reflects real level changes between appearances.
 */
async function setup3RoundsMocks(cards: Card[]) {
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
    selectCardsForRound: vi.fn((c: Card[]) => [...c])
  }))

  const { useGameStore } = await import('./useGameStore')
  return useGameStore()
}

/**
 * Arbitrary: generates 1–5 unique cards with random levels 1–5.
 * Questions use the "AxB" format expected by parseCardQuestion.
 */
const cardsArb = fc
  .integer({ min: 1, max: 5 })
  .chain(n =>
    fc.tuple(
      ...Array.from({ length: n }, (_, i) =>
        fc.integer({ min: 1, max: 5 }).map(level => makeCard(`${i + 3}x${i + 3}`, level))
      )
    )
  )

describe('useGameStore - 3-rounds mode independent scoring (Property 4)', () => {
  it(
    'each card appearance is scored independently and total equals sum of individual scores',
    { timeout: 30_000 },
    async () => {
      await fc.assert(
        fc.asyncProperty(cardsArb, async cards => {
          vi.resetModules()
          const store = await setup3RoundsMocks(cards)

          store.startGame({ select: 'all', focus: 'medium' }, '3-rounds', true)

          const totalAppearances = cards.length * LOOP_COUNT
          expect(store.gameCards.value).toHaveLength(totalAppearances)

          // Play through all card appearances, tracking expected points
          let expectedTotalPoints = 0

          for (let i = 0; i < totalAppearances; i++) {
            const card = store.currentCard.value
            expect(card).not.toBeNull()
            if (!card) break

            // Parse question to get difficulty (same logic as handleAnswer)
            const [yStr, xStr] = card.question.split('x')
            const x = Number.parseInt(xStr ?? '', 10) || 0
            const y = Number.parseInt(yStr ?? '', 10) || 0
            const difficultyPoints = Math.min(x, y)

            // Calculate expected points for this individual appearance
            const breakdown = calculatePointsBreakdown({
              difficultyPoints,
              level: card.level,
              timeBonus: false,
              closeAdjustment: false
            })
            expectedTotalPoints += breakdown.totalPoints

            // Answer correctly with a time that won't trigger time bonus
            store.handleAnswer('correct', MAX_TIME)
            store.nextCard()
          }

          // The accumulated store points should equal the sum of individual calculations
          expect(store.points.value).toBe(expectedTotalPoints)
        }),
        { numRuns: 100 }
      )
    }
  )
})
