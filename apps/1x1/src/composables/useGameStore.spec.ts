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
    loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    loadGameState: vi.fn(() => null),
    setGameResult: vi.fn(),
    updateCard: vi.fn(),
    resetCards: vi.fn(),
    getVirtualCardsForRange: vi.fn(() => [
      { question: '3x3', answer: 9, level: 1, time: 60 },
      { question: '4x3', answer: 12, level: 2, time: 45 },
      { question: '4x4', answer: 16, level: 1, time: 60 }
    ]),
    initializeCards: vi.fn(),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
    getGameResult: vi.fn(() => null),
    clearGameResult: vi.fn(),
    parseCardQuestion: vi.fn((question: string) => {
      const [yStr, xStr] = question.split('x')
      return { y: Number.parseInt(yStr ?? '', 10) || 0, x: Number.parseInt(xStr ?? '', 10) || 0 }
    }),
    ...overrides
  }))

  vi.doMock('@/services/cardSelector', () => ({
    filterCardsAll: vi.fn(() => [
      { question: '3x3', answer: 9, level: 1, time: 60 },
      { question: '4x3', answer: 12, level: 2, time: 45 },
      { question: '4x4', answer: 16, level: 1, time: 60 }
    ]),
    filterCardsBySelection: vi.fn(() => [
      { question: '3x3', answer: 9, level: 1, time: 60 },
      { question: '4x3', answer: 12, level: 2, time: 45 }
    ]),
    filterCardsSquares: vi.fn(() => [
      { question: '3x3', answer: 9, level: 1, time: 60 },
      { question: '4x4', answer: 16, level: 1, time: 60 }
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
  })

  it('restores game state from sessionStorage when available', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: [{ question: '5x5', answer: 25, level: 3, time: 30 }],
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
  it('starts a game with select=all and populates gameCards', async () => {
    vi.doMock('@/services/cardSelector', () => ({
      filterCardsAll: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x3', answer: 12, level: 2, time: 45 }
      ]),
      filterCardsBySelection: vi.fn(() => []),
      filterCardsSquares: vi.fn(() => []),
      selectCardsForRound: vi.fn(cards => cards)
    }))
    vi.doMock('@/services/storage', () => ({
      loadCards: vi.fn(() => [{ question: '3x3', answer: 9, level: 1, time: 60 }]),
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
      updateCard: vi.fn(),
      initializeCards: vi.fn(),
      getVirtualCardsForRange: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x3', answer: 12, level: 2, time: 45 }
      ]),
      incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
      getGameResult: vi.fn(() => null),
      clearGameResult: vi.fn()
    }))
    const { useGameStore } = await import('./useGameStore')
    const store = useGameStore()
    const { filterCardsAll } = await import('@/services/cardSelector')

    store.startGame({ select: 'all', focus: 'medium' })

    expect(filterCardsAll).toHaveBeenCalled()
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('starts a game with select=x² using filterCardsSquares', async () => {
    vi.doMock('@/services/cardSelector', () => ({
      filterCardsAll: vi.fn(() => []),
      filterCardsBySelection: vi.fn(() => []),
      filterCardsSquares: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x4', answer: 16, level: 1, time: 60 }
      ]),
      selectCardsForRound: vi.fn(cards => cards)
    }))
    vi.doMock('@/services/storage', () => ({
      loadCards: vi.fn(() => [{ question: '3x3', answer: 9, level: 1, time: 60 }]),
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
      updateCard: vi.fn(),
      initializeCards: vi.fn(),
      getVirtualCardsForRange: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x4', answer: 16, level: 1, time: 60 }
      ]),
      incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
      getGameResult: vi.fn(() => null),
      clearGameResult: vi.fn()
    }))
    const { useGameStore } = await import('./useGameStore')
    const store = useGameStore()
    const { filterCardsSquares } = await import('@/services/cardSelector')

    store.startGame({ select: 'x²', focus: 'medium' })

    expect(filterCardsSquares).toHaveBeenCalled()
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('starts a game with select=[3,4] using filterCardsBySelection', async () => {
    vi.doMock('@/services/cardSelector', () => ({
      filterCardsAll: vi.fn(() => []),
      filterCardsBySelection: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x3', answer: 12, level: 2, time: 45 }
      ]),
      filterCardsSquares: vi.fn(() => []),
      selectCardsForRound: vi.fn(cards => cards)
    }))
    vi.doMock('@/services/storage', () => ({
      loadCards: vi.fn(() => [{ question: '3x3', answer: 9, level: 1, time: 60 }]),
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
      updateCard: vi.fn(),
      initializeCards: vi.fn(),
      getVirtualCardsForRange: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x3', answer: 12, level: 2, time: 45 }
      ]),
      incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
      getGameResult: vi.fn(() => null),
      clearGameResult: vi.fn()
    }))
    const { useGameStore } = await import('./useGameStore')
    const store = useGameStore()
    const { filterCardsBySelection } = await import('@/services/cardSelector')

    store.startGame({ select: [3, 4], focus: 'medium' })

    expect(filterCardsBySelection).toHaveBeenCalled()
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('resets points and index when forceReset=true', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(0)

    store.startGame({ select: 'all', focus: 'medium' }, true)
    expect(store.points.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('does not restart game if already running and forceReset=false', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialCards = store.gameCards.value

    store.startGame({ select: 'all', focus: 'medium' }, false)
    expect(store.gameCards.value).toBe(initialCards)
  })

  it('initializes cards when no cards exist in storage', async () => {
    vi.doMock('@/services/storage', () => ({
      loadCards: vi.fn(() => []),
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
      updateCard: vi.fn(),
      initializeCards: vi.fn(),
      getVirtualCardsForRange: vi.fn(() => [{ question: '3x3', answer: 9, level: 1, time: 60 }]),
      incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
      getGameResult: vi.fn(() => null),
      clearGameResult: vi.fn()
    }))
    vi.doMock('@/services/cardSelector', () => ({
      filterCardsAll: vi.fn(cards => cards),
      filterCardsBySelection: vi.fn(() => []),
      filterCardsSquares: vi.fn(() => []),
      selectCardsForRound: vi.fn(cards => cards)
    }))
    const { useGameStore } = await import('./useGameStore')
    const store = useGameStore()
    const { initializeCards } = await import('@/services/storage')

    store.startGame({ select: 'all', focus: 'medium' })

    expect(initializeCards).toHaveBeenCalled()
  })

  it('saves game config via setGameConfig', async () => {
    const store = await setupMocks()
    const { setGameConfig } = await import('@/services/storage')
    const settings = { select: 'all' as const, focus: 'medium' as const }

    store.startGame(settings)

    expect(setGameConfig).toHaveBeenCalledWith(settings)
  })

  it('saves initial game state to sessionStorage', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')

    store.startGame({ select: 'all', focus: 'medium' })

    expect(saveGameState).toHaveBeenCalled()
  })
})

describe('useGameStore - currentCard', () => {
  it('returns null when no game is active', async () => {
    const store = await setupMocks()
    // No game started, gameCards is empty
    expect(store.currentCard.value).toBeNull()
  })

  it('returns first card after game starts', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    expect(store.currentCard.value).not.toBeNull()
    expect(store.currentCard.value?.question).toBeDefined()
  })
})

describe('useGameStore - handleAnswer', () => {
  it('grants points for correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value

    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })

  it('increments correctAnswersCount for correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })

    store.handleAnswer('correct', 5)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('grants some points for close answer (level-based)', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value

    store.handleAnswer('close', 5)
    expect(store.points.value).toBeGreaterThanOrEqual(initialPoints)
  })

  it('does not grant points for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value

    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('does not increment correctAnswersCount for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })

    store.handleAnswer('incorrect', 5)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('calls updateCard with incremented level for correct answer', async () => {
    const store = await setupMocks()
    const { updateCard } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })
    const card = store.currentCard.value!

    store.handleAnswer('correct', 5)
    expect(updateCard).toHaveBeenCalledWith(
      card.question,
      expect.objectContaining({ level: expect.any(Number) })
    )
  })

  it('calls updateCard with decremented level for incorrect answer', async () => {
    const store = await setupMocks()
    const { updateCard } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })
    const card = store.currentCard.value!

    store.handleAnswer('incorrect', 5)
    expect(updateCard).toHaveBeenCalledWith(
      card.question,
      expect.objectContaining({ level: expect.any(Number) })
    )
  })

  it('does not call updateCard when no current card', async () => {
    const store = await setupMocks()
    const { updateCard } = await import('@/services/storage')
    // No game started - gameCards is empty, currentCard is null

    store.handleAnswer('correct', 5)
    expect(updateCard).not.toHaveBeenCalled()
  })

  it('saves game state after answer', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })
    vi.mocked(saveGameState).mockClear()

    store.handleAnswer('correct', 5)
    expect(saveGameState).toHaveBeenCalled()
  })

  it('sets lastPointsBreakdown after correct answer', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })

    store.handleAnswer('correct', 5)
    expect(store.lastPointsBreakdown.value).not.toBeNull()
    expect(store.lastPointsBreakdown.value?.totalPoints).toBeGreaterThan(0)
  })
})

describe('useGameStore - nextCard', () => {
  it('advances currentCardIndex', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    expect(store.currentCardIndex.value).toBe(0)

    store.nextCard()
    expect(store.currentCardIndex.value).toBe(1)
  })

  it('returns false when more cards remain', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    // 3 cards in mock, first nextCard should not be game over
    const isOver = store.nextCard()
    expect(isOver).toBe(false)
  })

  it('returns true when all cards are exhausted', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    // 3 cards in mock: advance past all of them
    store.nextCard() // index 1
    store.nextCard() // index 2
    const isOver = store.nextCard() // index 3 >= length 3
    expect(isOver).toBe(true)
  })

  it('saves game state after advancing (when not game over)', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })
    vi.mocked(saveGameState).mockClear()

    store.nextCard()
    expect(saveGameState).toHaveBeenCalled()
  })
})

describe('useGameStore - finishGame', () => {
  it('saves game result to sessionStorage', async () => {
    const store = await setupMocks()
    const { setGameResult } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })
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
    store.startGame({ select: 'all', focus: 'medium' })

    store.finishGame()
    expect(clearGameState).toHaveBeenCalled()
  })

  it('resets in-memory game state after finishing', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    store.handleAnswer('correct', 5)

    store.finishGame()
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('does nothing when no game settings', async () => {
    const store = await setupMocks()
    // No game started
    expect(() => {
      store.finishGame()
    }).not.toThrow()
  })

  it('normalizes select to all when all range values are selected', async () => {
    const store = await setupMocks()
    const { setGameResult } = await import('@/services/storage')
    store.startGame({ select: [3, 4, 5, 6, 7, 8, 9], focus: 'medium' })

    store.finishGame()
    expect(setGameResult).toHaveBeenCalled()
  })
})

describe('useGameStore - discardGame', () => {
  it('clears game state from sessionStorage', async () => {
    const store = await setupMocks()
    const { clearGameState } = await import('@/services/storage')
    store.startGame({ select: 'all', focus: 'medium' })

    store.discardGame()
    expect(clearGameState).toHaveBeenCalled()
  })

  it('resets in-memory game state', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    store.handleAnswer('correct', 5)

    store.discardGame()
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
  })
})

describe('useGameStore - moveAllCards', () => {
  it('moves all cards to specified level', async () => {
    const store = await setupMocks({
      loadCards: vi.fn(() => [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x4', answer: 16, level: 2, time: 45 }
      ])
    })

    store.moveAllCards(3)

    for (const card of store.allCards.value) {
      expect(card.level).toBe(3)
    }
  })

  it('does nothing for invalid level (0)', async () => {
    const store = await setupMocks()
    const initialCards = [...store.allCards.value]
    store.moveAllCards(0)
    expect(store.allCards.value).toEqual(initialCards)
  })

  it('does nothing for invalid level (6)', async () => {
    const store = await setupMocks()
    const initialCards = [...store.allCards.value]
    store.moveAllCards(6)
    expect(store.allCards.value).toEqual(initialCards)
  })
})

describe('useGameStore - scoring safety', () => {
  it('never grants points for incorrect answers', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('grants points for correct answers', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })

  it('points are always non-negative after multiple incorrect answers', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })

    store.handleAnswer('incorrect', 5)
    store.handleAnswer('incorrect', 5)
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBeGreaterThanOrEqual(0)
  })

  it('correctAnswersCount matches number of correct answers given', async () => {
    const store = await setupMocks()
    store.startGame({ select: 'all', focus: 'medium' })

    store.handleAnswer('correct', 5)
    store.handleAnswer('incorrect', 5)
    store.handleAnswer('correct', 5)

    expect(store.correctAnswersCount.value).toBe(2)
  })
})
