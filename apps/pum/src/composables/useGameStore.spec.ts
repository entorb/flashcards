import { beforeEach, describe, expect, it, vi } from 'vitest'

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
})

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
    loadRange: vi.fn(() => []),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    loadGameState: vi.fn(() => null),
    setGameResult: vi.fn(),
    updateCard: vi.fn(),
    resetCards: vi.fn(),
    initializeCards: vi.fn(),
    getDifficultyForCard: vi.fn(() => 1),
    getDifficultyFromQuestion: vi.fn(() => 'simple'),
    getOperationFromQuestion: vi.fn(() => 'plus'),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
    getGameResult: vi.fn(() => null),
    clearGameResult: vi.fn(),
    ...overrides
  }))

  vi.doMock('@/services/cardSelector', () => ({
    filterCards: vi.fn(() => [
      { question: '3+3', answer: 6, level: 1, time: 60 },
      { question: '5+2', answer: 7, level: 2, time: 45 },
      { question: '4+4', answer: 8, level: 1, time: 60 }
    ]),
    selectCardsForRound: vi.fn(cards => cards)
  }))

  const { useGameStore } = await import('./useGameStore')
  return useGameStore()
}

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
        gameCards: [{ question: '5+3', answer: 8, level: 3, time: 30 }],
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
  it('starts a game and populates gameCards', async () => {
    const store = await setupMocks()
    const { filterCards } = await import('@/services/cardSelector')

    store.startGame({
      operations: ['plus'],
      difficulties: ['simple'],
      focus: 'medium'
    })

    expect(filterCards).toHaveBeenCalled()
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })
})

describe('useGameStore - answerCard', () => {
  it('increments correctAnswersCount on correct answer', async () => {
    const store = await setupMocks({
      getGameConfig: vi.fn(() => ({
        operations: ['plus'],
        difficulties: ['simple'],
        focus: 'medium'
      })),
      loadGameState: vi.fn(() => ({
        gameCards: [{ question: '3+3', answer: 6, level: 1, time: 60 }],
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0
      }))
    })

    store.handleAnswer('correct', 5)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('does not increment correctAnswersCount on wrong answer', async () => {
    const store = await setupMocks({
      getGameConfig: vi.fn(() => ({
        operations: ['plus'],
        difficulties: ['simple'],
        focus: 'medium'
      })),
      loadGameState: vi.fn(() => ({
        gameCards: [{ question: '3+3', answer: 6, level: 1, time: 60 }],
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0
      }))
    })

    store.handleAnswer('incorrect', 5)
    expect(store.correctAnswersCount.value).toBe(0)
  })
})
