import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from './useGameStore'

vi.mock('../services/storage', () => ({
  loadDecks: vi.fn(() => [{ name: 'en', cards: [{ word: 'hello', level: 1, time: 60 }] }]),
  saveDecks: vi.fn(),
  loadCards: vi.fn(() => [{ word: 'hello', level: 1, time: 60 }]),
  saveCards: vi.fn(),
  loadSettings: vi.fn(() => ({ mode: 'copy', focus: 'medium', deck: 'en' })),
  saveSettings: vi.fn(),
  loadGameConfig: vi.fn(() => ({ mode: 'copy', focus: 'medium', deck: 'en' })),
  saveGameConfig: vi.fn(),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
  loadStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
  saveStats: vi.fn(),
  loadGameState: vi.fn(() => null),
  saveGameState: vi.fn(),
  clearGameState: vi.fn(),
  setGameResult: vi.fn()
}))

vi.mock('../services/cardSelector', () => ({
  selectCards: vi.fn(() => [{ word: 'hello', level: 1, time: 60 }])
}))

describe('useGameStore - lwk Scoring safety', () => {
  let store: ReturnType<typeof useGameStore>
  beforeEach(() => {
    vi.clearAllMocks()
    store = useGameStore()
  })

  it('should never grant points for incorrect answers (copy mode)', () => {
    store.startGame({ mode: 'copy', focus: 'medium', deck: 'en' })
    const initialPoints = store.points.value
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('should never grant points for incorrect answers (hidden mode)', () => {
    store.startGame({ mode: 'hidden', focus: 'medium', deck: 'en' })
    const initialPoints = store.points.value
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('should grant points for correct answers', () => {
    store.startGame({ mode: 'copy', focus: 'medium', deck: 'en' })
    const initialPoints = store.points.value
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })
})
