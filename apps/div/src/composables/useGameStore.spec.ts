import { MAX_LEVEL, MIN_LEVEL } from '@flashcards/shared'
import fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('quasar', () => ({
  Notify: { create: vi.fn() },
  Dialog: { create: vi.fn() }
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ path: '/' }))
}))

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
  globalThis.localStorage.clear()
  globalThis.sessionStorage.clear()
})

// Default mock cards for div app (division cards: "Z:D" → answer)
const defaultMockCards = [
  { question: '6:2', answer: 3, level: 1, time: 60 },
  { question: '6:3', answer: 2, level: 1, time: 60 },
  { question: '12:3', answer: 4, level: 2, time: 45 }
]

// Storage mock factory - called after resetModules in each test
async function setupMocks(overrides: Record<string, unknown> = {}) {
  vi.doMock('@/services/storage', () => ({
    loadCards: vi.fn(() => []),
    loadHistory: vi.fn(() => []),
    saveHistory: vi.fn(),
    loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
    saveGameStats: vi.fn(),
    getGameConfig: vi.fn(() => null),
    setGameConfig: vi.fn(),
    loadRange: vi.fn(() => [2, 3, 4, 5, 6, 7, 8, 9]),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    loadGameState: vi.fn(() => null),
    setGameResult: vi.fn(),
    updateCard: vi.fn(),
    resetCards: vi.fn(),
    getVirtualCardsForRange: vi.fn(() => [...defaultMockCards]),
    initializeCards: vi.fn(),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
    getGameResult: vi.fn(() => null),
    clearGameResult: vi.fn(),
    parseCardQuestion: vi.fn((question: string) => {
      const [dividendStr, divisorStr] = question.split(':')
      return {
        dividend: Number.parseInt(dividendStr ?? '', 10) || 0,
        divisor: Number.parseInt(divisorStr ?? '', 10) || 0
      }
    }),
    ...overrides
  }))

  vi.doMock('@/services/cardSelector', () => ({
    filterCardsByDivisor: vi.fn((cards: Array<{ question: string }>, selection: number[]) => {
      const selectSet = new Set(selection)
      return cards.filter(card => {
        const divisor = Number.parseInt(card.question.split(':')[1] ?? '', 10) || 0
        return selectSet.has(divisor)
      })
    }),
    selectCardsForRound: vi.fn(cards => cards)
  }))

  const { useGameStore } = await import('./useGameStore')
  return useGameStore()
}

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('useGameStore - Property Tests', () => {
  // Feature: div-app, Property 5: Scoring difficulty equals divisor value
  // **Validates: Requirements 5.1**
  it('Property 5: difficulty points equal the divisor value for any division card', async () => {
    // Generate random division cards with divisors 2-9
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 9 }),
        fc.integer({ min: 2, max: 9 }),
        async (divisor, factor) => {
          vi.resetModules()
          globalThis.localStorage.clear()
          globalThis.sessionStorage.clear()

          const dividend = divisor * factor
          const card = { question: `${dividend}:${divisor}`, answer: factor, level: 1, time: 60 }

          vi.doMock('@/services/storage', () => ({
            loadCards: vi.fn(() => []),
            loadHistory: vi.fn(() => []),
            saveHistory: vi.fn(),
            loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
            saveGameStats: vi.fn(),
            getGameConfig: vi.fn(() => null),
            setGameConfig: vi.fn(),
            loadRange: vi.fn(() => [2, 3, 4, 5, 6, 7, 8, 9]),
            saveGameState: vi.fn(),
            clearGameState: vi.fn(),
            loadGameState: vi.fn(() => null),
            setGameResult: vi.fn(),
            updateCard: vi.fn(),
            resetCards: vi.fn(),
            getVirtualCardsForRange: vi.fn(() => [card]),
            initializeCards: vi.fn(),
            incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
            getGameResult: vi.fn(() => null),
            clearGameResult: vi.fn(),
            parseCardQuestion: vi.fn((question: string) => {
              const [dStr, dvStr] = question.split(':')
              return {
                dividend: Number.parseInt(dStr ?? '', 10) || 0,
                divisor: Number.parseInt(dvStr ?? '', 10) || 0
              }
            })
          }))

          vi.doMock('@/services/cardSelector', () => ({
            filterCardsByDivisor: vi.fn(() => [card]),
            selectCardsForRound: vi.fn(() => [card])
          }))

          const { useGameStore } = await import('./useGameStore')
          const store = useGameStore()

          store.startGame({ select: [divisor], focus: 'medium' }, 'standard', true)
          expect(store.currentCard.value).not.toBeNull()

          store.handleAnswer('correct', 5)

          // The points breakdown should include difficultyPoints = divisor
          const breakdown = store.lastPointsBreakdown.value
          expect(breakdown).not.toBeNull()
          expect(breakdown?.difficultyPoints).toBe(divisor)
        }
      ),
      { numRuns: 20 }
    )
  }, 60_000)

  // Feature: div-app, Property 6: Level update on answer
  // **Validates: Requirements 5.4, 5.5**
  it('Property 6: correct answer → min(L+1, MAX_LEVEL), incorrect → max(L-1, MIN_LEVEL)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        fc.boolean(),
        async (startLevel, isCorrect) => {
          vi.resetModules()
          globalThis.localStorage.clear()
          globalThis.sessionStorage.clear()

          const card = { question: '18:3', answer: 6, level: startLevel, time: 60 }
          let capturedUpdate: { level?: number } = {}

          vi.doMock('@/services/storage', () => ({
            loadCards: vi.fn(() => []),
            loadHistory: vi.fn(() => []),
            saveHistory: vi.fn(),
            loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
            saveGameStats: vi.fn(),
            getGameConfig: vi.fn(() => null),
            setGameConfig: vi.fn(),
            loadRange: vi.fn(() => [2, 3, 4, 5, 6, 7, 8, 9]),
            saveGameState: vi.fn(),
            clearGameState: vi.fn(),
            loadGameState: vi.fn(() => null),
            setGameResult: vi.fn(),
            updateCard: vi.fn((_q: string, updates: { level?: number }) => {
              capturedUpdate = updates
            }),
            resetCards: vi.fn(),
            getVirtualCardsForRange: vi.fn(() => [card]),
            initializeCards: vi.fn(),
            incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
            getGameResult: vi.fn(() => null),
            clearGameResult: vi.fn(),
            parseCardQuestion: vi.fn((question: string) => {
              const [dStr, dvStr] = question.split(':')
              return {
                dividend: Number.parseInt(dStr ?? '', 10) || 0,
                divisor: Number.parseInt(dvStr ?? '', 10) || 0
              }
            })
          }))

          vi.doMock('@/services/cardSelector', () => ({
            filterCardsByDivisor: vi.fn(() => [card]),
            selectCardsForRound: vi.fn(() => [card])
          }))

          const { useGameStore } = await import('./useGameStore')
          const store = useGameStore()

          store.startGame({ select: [3], focus: 'medium' }, 'standard', true)
          expect(store.currentCard.value).not.toBeNull()

          const result = isCorrect ? 'correct' : 'incorrect'
          store.handleAnswer(result, 5)

          const expectedLevel = isCorrect
            ? Math.min(startLevel + 1, MAX_LEVEL)
            : Math.max(startLevel - 1, MIN_LEVEL)

          expect(capturedUpdate.level).toBe(expectedLevel)
        }
      ),
      { numRuns: 20 }
    )
  }, 60_000)
})

// ============================================================================
// UNIT TESTS
// ============================================================================

describe('useGameStore - initialization', () => {
  it('starts with empty gameCards and zero points', async () => {
    const store = await setupMocks()
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
  }, 15_000)

  it('restores game state from sessionStorage when available', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: [{ question: '18:3', answer: 6, level: 3, time: 30 }],
        currentCardIndex: 0,
        points: 10,
        correctAnswersCount: 1
      }))
    })
    expect(store.gameCards.value).toHaveLength(1)
    expect(store.points.value).toBe(10)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('does not restore state when savedGameState has no cards', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: [],
        currentCardIndex: 0,
        points: 5,
        correctAnswersCount: 1
      }))
    })
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
  })
})

describe('useGameStore - startGame', () => {
  it('starts a game with selected divisors and populates gameCards', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('resets points and index when forceReset=true', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(0)

    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    expect(store.points.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('does not restart game if already running and forceReset=false', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    const initialCards = store.gameCards.value

    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', false)
    expect(store.gameCards.value).toBe(initialCards)
  })

  it('initializes cards when no cards exist in storage', async () => {
    const store = await setupMocks()
    const { initializeCards } = await import('@/services/storage')

    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    expect(initializeCards).toHaveBeenCalled()
  })

  it('saves game config via setGameConfig', async () => {
    const store = await setupMocks()
    const { setGameConfig } = await import('@/services/storage')
    const settings = { select: [2, 3], focus: 'medium' as const }

    store.startGame(settings, 'standard', true)
    expect(setGameConfig).toHaveBeenCalledWith(settings)
  })

  it('saves initial game state to sessionStorage', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')

    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    expect(saveGameState).toHaveBeenCalled()
  })
})

describe('useGameStore - handleAnswer', () => {
  it('grants points for correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    const initialPoints = store.points.value

    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })

  it('increments correctAnswersCount for correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)

    store.handleAnswer('correct', 5)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('does not grant points for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    const initialPoints = store.points.value

    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('does not increment correctAnswersCount for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)

    store.handleAnswer('incorrect', 5)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('calls updateCard with incremented level for correct answer', async () => {
    const store = await setupMocks()
    const { updateCard } = await import('@/services/storage')
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    const card = store.currentCard.value!
    const originalLevel = card.level

    store.handleAnswer('correct', 5)
    expect(updateCard).toHaveBeenCalledWith(
      card.question,
      expect.objectContaining({ level: Math.min(originalLevel + 1, MAX_LEVEL) })
    )
  })

  it('calls updateCard with decremented level for incorrect answer', async () => {
    // Use a card with level > 1 so decrement is visible
    const lvl2Card = { question: '12:3', answer: 4, level: 2, time: 45 }
    const store = await setupMocks({
      getVirtualCardsForRange: vi.fn(() => [lvl2Card])
    })
    const { updateCard } = await import('@/services/storage')
    store.startGame({ select: [3], focus: 'medium' }, 'standard', true)
    const card = store.currentCard.value!
    const originalLevel = card.level

    store.handleAnswer('incorrect', 5)
    expect(updateCard).toHaveBeenCalledWith(
      card.question,
      expect.objectContaining({ level: Math.max(originalLevel - 1, MIN_LEVEL) })
    )
  })

  it('awards speed bonus when answer time beats previous best', async () => {
    // Card with previous time of 10s, answer in 5s → should get speed bonus
    const fastCard = { question: '6:2', answer: 3, level: 1, time: 10 }
    const store = await setupMocks({
      getVirtualCardsForRange: vi.fn(() => [fastCard])
    })
    store.startGame({ select: [2], focus: 'medium' }, 'standard', true)

    store.handleAnswer('correct', 5)
    const breakdown = store.lastPointsBreakdown.value
    expect(breakdown).not.toBeNull()
    expect(breakdown?.timeBonus).toBe(5) // SPEED_BONUS_POINTS
  })

  it('does not call updateCard when no current card', async () => {
    const store = await setupMocks()
    const { updateCard } = await import('@/services/storage')

    store.handleAnswer('correct', 5)
    expect(updateCard).not.toHaveBeenCalled()
  })

  it('saves game state after answer', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    vi.mocked(saveGameState).mockClear()

    store.handleAnswer('correct', 5)
    expect(saveGameState).toHaveBeenCalled()
  })

  it('sets lastPointsBreakdown after correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)

    store.handleAnswer('correct', 5)
    expect(store.lastPointsBreakdown.value).not.toBeNull()
    expect(store.lastPointsBreakdown.value?.totalPoints).toBeGreaterThan(0)
  })
})

describe('useGameStore - finishGame', () => {
  it('saves game result to sessionStorage', async () => {
    const store = await setupMocks()
    const { setGameResult } = await import('@/services/storage')
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    store.handleAnswer('correct', 5)

    store.finishGame()
    expect(setGameResult).toHaveBeenCalledWith(
      expect.objectContaining({
        points: expect.any(Number),
        correctAnswers: expect.any(Number),
        totalCards: expect.any(Number)
      })
    )
  })

  it('clears game state from sessionStorage', async () => {
    const store = await setupMocks()
    const { clearGameState } = await import('@/services/storage')
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)

    store.finishGame()
    expect(clearGameState).toHaveBeenCalled()
  })

  it('resets in-memory game state after finishing', async () => {
    const store = await setupMocks()
    store.startGame({ select: [2, 3], focus: 'medium' }, 'standard', true)
    store.handleAnswer('correct', 5)

    store.finishGame()
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('does nothing when no game settings', async () => {
    const store = await setupMocks()
    expect(() => {
      store.finishGame()
    }).not.toThrow()
  })
})
