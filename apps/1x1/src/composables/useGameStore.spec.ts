import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from './useGameStore'

vi.mock('@/services/storage', () => ({
  loadCards: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }]),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
  loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
  saveGameStats: vi.fn(),
  getGameConfig: vi.fn(() => ({ select: 'all', focus: 'medium' })),
  setGameConfig: vi.fn(),
  loadRange: vi.fn(() => [1, 10]),
  saveGameState: vi.fn(),
  clearGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  setGameResult: vi.fn(),
  updateCard: vi.fn(),
  resetCards: vi.fn(),
  getVirtualCardsForRange: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }]),
  initializeCards: vi.fn(),
  incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
  getGameResult: vi.fn(() => null),
  clearGameResult: vi.fn()
}))

vi.mock('@/services/cardSelector', () => ({
  filterCardsAll: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }]),
  filterCardsBySelection: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }]),
  filterCardsSquares: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }]),
  selectCardsForRound: vi.fn(() => [{ question: '2x2', answer: 4, level: 1, time: 60 }])
}))

describe('useGameStore - 1x1 Scoring safety', () => {
  let store: ReturnType<typeof useGameStore>
  beforeEach(() => {
    vi.clearAllMocks()
    store = useGameStore()
  })

  it('should never grant points for incorrect answers', () => {
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('should grant points for correct answers', () => {
    store.startGame({ select: 'all', focus: 'medium' })
    const initialPoints = store.points.value
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })
})
