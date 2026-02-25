// Feature: game-modes-endless-and-loops, Property 6
// **Validates: Requirements 7.1, 7.2**
import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionMode } from '@flashcards/shared'

import type { Card } from '@/types'

const defaultCards: Card[] = [
  { question: '3x3', answer: 9, level: 1, time: 60 },
  { question: '4x3', answer: 12, level: 2, time: 45 },
  { question: '4x4', answer: 16, level: 1, time: 60 }
]

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
})

/**
 * Arbitrary: generates a valid SessionMode value.
 */
const sessionModeArb = fc.constantFrom<SessionMode>('standard', 'endless-level1', '3-rounds')

describe('useGameStore - SessionMode round-trip through sessionStorage (Property 6)', () => {
  it('persisting sessionMode via startGame and restoring it via loadGameState yields the same value', async () => {
    await fc.assert(
      fc.asyncProperty(sessionModeArb, async mode => {
        vi.resetModules()

        // Track what saveGameState receives
        let savedState: Record<string, unknown> | null = null

        // Phase 1 mock: loadGameState returns null (fresh start), saveGameState captures state
        vi.doMock('@/services/storage', () => ({
          loadCards: vi.fn(() => [...defaultCards]),
          loadHistory: vi.fn(() => []),
          saveHistory: vi.fn(),
          loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
          saveGameStats: vi.fn(),
          getGameConfig: vi.fn(() => null),
          setGameConfig: vi.fn(),
          loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
          saveGameState: vi.fn((state: Record<string, unknown>) => {
            savedState = state
          }),
          clearGameState: vi.fn(),
          // On first call: no saved state. On subsequent calls after startGame: return saved state.
          // We use a closure to switch behavior after startGame persists.
          loadGameState: vi.fn(() => null),
          setGameResult: vi.fn(),
          updateCard: vi.fn(),
          resetCards: vi.fn(),
          getVirtualCardsForRange: vi.fn(() => [...defaultCards]),
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
          filterCardsAll: vi.fn(() => [...defaultCards]),
          filterCardsBySelection: vi.fn(() => [...defaultCards]),
          filterCardsSquares: vi.fn(() => [...defaultCards]),
          selectCardsForRound: vi.fn((c: Card[]) => c)
        }))

        // Phase 1: Start a game — this persists sessionMode via saveGameState
        const { useGameStore: useStore1 } = await import('./useGameStore')
        const store1 = useStore1()
        store1.startGame({ select: 'all', focus: 'medium' }, mode, true)

        // Verify saveGameState was called with the correct sessionMode
        expect(savedState).not.toBeNull()
        if (savedState === null) throw new Error('savedState should not be null')
        expect(savedState['sessionMode']).toBe(mode)

        // Phase 2: Simulate reload — new module with loadGameState returning saved state
        vi.resetModules()

        vi.doMock('@/services/storage', () => ({
          loadCards: vi.fn(() => [...defaultCards]),
          loadHistory: vi.fn(() => []),
          saveHistory: vi.fn(),
          loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
          saveGameStats: vi.fn(),
          getGameConfig: vi.fn(() => null),
          setGameConfig: vi.fn(),
          loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
          saveGameState: vi.fn(),
          clearGameState: vi.fn(),
          loadGameState: vi.fn(() => savedState),
          setGameResult: vi.fn(),
          updateCard: vi.fn(),
          resetCards: vi.fn(),
          getVirtualCardsForRange: vi.fn(() => [...defaultCards]),
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
          filterCardsAll: vi.fn(() => [...defaultCards]),
          filterCardsBySelection: vi.fn(() => [...defaultCards]),
          filterCardsSquares: vi.fn(() => [...defaultCards]),
          selectCardsForRound: vi.fn((c: Card[]) => c)
        }))

        // Create new store — it should restore sessionMode from loadGameState
        const { useGameStore: useStore2 } = await import('./useGameStore')
        const store2 = useStore2()

        // The restored sessionMode should match the original
        expect(store2.sessionMode.value).toBe(mode)
      }),
      { numRuns: 100 }
    )
  }, 60_000)
})
