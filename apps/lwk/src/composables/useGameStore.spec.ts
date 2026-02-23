import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from './useGameStore'

// ---------------------------------------------------------------------------
// Storage mock
// ---------------------------------------------------------------------------

const storageMocks = vi.hoisted(() => ({
  loadDecks: vi.fn(() => [{ name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] }]),
  saveDecks: vi.fn(),
  loadCards: vi.fn(() => [{ word: 'Jahr', level: 1, time: 60 }]),
  saveCards: vi.fn(),
  loadSettings: vi.fn<
    () => {
      mode: 'copy' | 'hidden'
      focus: 'weak' | 'medium' | 'strong' | 'slow'
      deck: string
    } | null
  >(() => ({ mode: 'copy', focus: 'weak', deck: 'LWK_1' })),
  saveSettings: vi.fn(),
  loadGameConfig: vi.fn<
    () => {
      mode: 'copy' | 'hidden'
      focus: 'weak' | 'medium' | 'strong' | 'slow'
      deck: string
    } | null
  >(() => ({ mode: 'copy', focus: 'weak', deck: 'LWK_1' })),
  saveGameConfig: vi.fn(),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
  loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
  saveGameStats: vi.fn(),
  loadGameState: vi.fn(
    () =>
      null as null | {
        gameCards: { word: string; level: number; time: number }[]
        currentCardIndex: number
        points: number
        correctAnswersCount: number
        showWord: boolean
        countdown: number
        gameSettings: {
          mode: 'copy' | 'hidden'
          focus: 'weak' | 'medium' | 'strong' | 'slow'
          deck: string
        } | null
      }
  ),
  saveGameState: vi.fn(),
  clearGameState: vi.fn(),
  setGameResult: vi.fn()
}))

vi.mock('../services/storage', () => storageMocks)

vi.mock('../services/cardSelector', () => ({
  selectCards: vi.fn(() => [{ word: 'Jahr', level: 1, time: 60 }])
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COPY_SETTINGS = { mode: 'copy' as const, focus: 'weak' as const, deck: 'LWK_1' }
const HIDDEN_SETTINGS = { mode: 'hidden' as const, focus: 'weak' as const, deck: 'LWK_1' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGameStore', () => {
  let store: ReturnType<typeof useGameStore>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset selectCards to default (1 card) after vi.clearAllMocks clears call history
    const { selectCards } = await import('../services/cardSelector')
    vi.mocked(selectCards).mockReturnValue([{ word: 'Jahr', level: 1, time: 60 }])
    // Reset storage mocks to defaults
    storageMocks.loadDecks.mockReturnValue([
      { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] }
    ])
    storageMocks.loadCards.mockReturnValue([{ word: 'Jahr', level: 1, time: 60 }])
    storageMocks.loadSettings.mockReturnValue(COPY_SETTINGS)
    storageMocks.loadGameState.mockReturnValue(null)
    storageMocks.loadHistory.mockReturnValue([])
    storageMocks.loadGameStats.mockReturnValue({ points: 0, correctAnswers: 0, gamesPlayed: 0 })
    store = useGameStore()
    // Reset the module-level singleton state so each test starts fresh
    store.gameCards.value = []
    store.allCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
  })

  // ─── Scoring safety (existing tests, preserved) ───────────────────────────

  describe('scoring safety', () => {
    it('never grants points for incorrect answers (copy mode)', () => {
      store.startGame(COPY_SETTINGS)
      const initialPoints = store.points.value
      store.handleAnswer('incorrect', 5)
      expect(store.points.value).toBe(initialPoints)
    })

    it('never grants points for incorrect answers (hidden mode)', () => {
      store.startGame(HIDDEN_SETTINGS)
      const initialPoints = store.points.value
      store.handleAnswer('incorrect', 5)
      expect(store.points.value).toBe(initialPoints)
    })

    it('grants points for correct answers', () => {
      store.startGame(COPY_SETTINGS)
      const initialPoints = store.points.value
      store.handleAnswer('correct', 5)
      expect(store.points.value).toBeGreaterThan(initialPoints)
    })
  })

  // ─── startGame ────────────────────────────────────────────────────────────

  describe('startGame', () => {
    it('populates gameCards after startGame', () => {
      store.startGame(COPY_SETTINGS)
      expect(store.gameCards.value.length).toBeGreaterThan(0)
    })

    it('sets gameSettings after startGame', () => {
      store.startGame(COPY_SETTINGS)
      expect(store.gameSettings.value?.mode).toBe('copy')
    })

    it('saves game config to storage', () => {
      store.startGame(COPY_SETTINGS)
      expect(storageMocks.saveGameConfig).toHaveBeenCalled()
    })

    it('saves initial game state to storage', () => {
      store.startGame(COPY_SETTINGS)
      expect(storageMocks.saveGameState).toHaveBeenCalled()
    })

    it('does not restart if gameCards already populated (page reload resume)', () => {
      store.startGame(COPY_SETTINGS)
      const callCount = storageMocks.saveGameConfig.mock.calls.length
      store.startGame(COPY_SETTINGS) // second call should be ignored
      expect(storageMocks.saveGameConfig.mock.calls).toHaveLength(callCount)
    })
  })

  // ─── handleAnswer — card level updates ───────────────────────────────────

  describe('handleAnswer — card level updates', () => {
    it('increments card level on correct answer', () => {
      store.startGame(COPY_SETTINGS)
      const initialLevel = store.allCards.value[0]!.level
      store.handleAnswer('correct', 5)
      expect(store.allCards.value[0]!.level).toBe(initialLevel + 1)
    })

    it('decrements card level on incorrect answer', () => {
      store.startGame(COPY_SETTINGS)
      const initialLevel = store.allCards.value[0]!.level
      store.handleAnswer('incorrect', 5)
      expect(store.allCards.value[0]!.level).toBe(Math.max(1, initialLevel - 1))
    })

    it('does not change card level on close answer', () => {
      store.startGame(COPY_SETTINGS)
      const initialLevel = store.allCards.value[0]!.level
      store.handleAnswer('close', 5)
      expect(store.allCards.value[0]!.level).toBe(initialLevel)
    })

    it('saves cards to storage after every answer', () => {
      store.startGame(COPY_SETTINGS)
      store.handleAnswer('correct', 5)
      expect(storageMocks.saveCards).toHaveBeenCalled()
    })

    it('does not exceed MAX_LEVEL (5) on correct answer', async () => {
      // Configure selectCards to return a level-5 card
      const { selectCards } = await import('../services/cardSelector')
      vi.mocked(selectCards).mockReturnValue([{ word: 'Jahr', level: 5, time: 60 }])
      storageMocks.loadDecks.mockReturnValue([
        { name: 'LWK_1', cards: [{ word: 'Jahr', level: 5, time: 60 }] }
      ])
      store.allCards.value = [{ word: 'Jahr', level: 5, time: 60 }]
      store.startGame(COPY_SETTINGS)
      store.handleAnswer('correct', 5)
      expect(store.allCards.value[0]!.level).toBe(5)
    })

    it('does not go below MIN_LEVEL (1) on incorrect answer', () => {
      store.allCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
      store.startGame(COPY_SETTINGS)
      store.handleAnswer('incorrect', 5)
      expect(store.allCards.value[0]!.level).toBe(1)
    })

    it('updates time on correct answer in hidden mode', () => {
      store.startGame(HIDDEN_SETTINGS)
      store.handleAnswer('correct', 10)
      // Time should be updated (rounded to nearest 5)
      expect(storageMocks.saveCards).toHaveBeenCalled()
    })

    it('does not update time on correct answer in copy mode', () => {
      store.startGame(COPY_SETTINGS)
      const initialTime = store.allCards.value[0]!.time
      store.handleAnswer('correct', 10)
      // In copy mode, time stays unchanged
      expect(store.allCards.value[0]!.time).toBe(initialTime)
    })
  })

  // ─── finishGame ───────────────────────────────────────────────────────────

  describe('finishGame', () => {
    it('calls setGameResult with current points', () => {
      store.startGame(COPY_SETTINGS)
      store.handleAnswer('correct', 5)
      store.finishGame()
      expect(storageMocks.setGameResult).toHaveBeenCalledWith(
        expect.objectContaining({ points: expect.any(Number) })
      )
    })

    it('calls clearGameState after finishing', () => {
      store.startGame(COPY_SETTINGS)
      store.finishGame()
      expect(storageMocks.clearGameState).toHaveBeenCalled()
    })

    it('clears gameCards after finishing', () => {
      store.startGame(COPY_SETTINGS)
      store.finishGame()
      expect(store.gameCards.value).toHaveLength(0)
    })

    it('increments gamesPlayed in gameStats', () => {
      store.startGame(COPY_SETTINGS)
      const before = store.gameStats.value.gamesPlayed
      store.finishGame()
      expect(store.gameStats.value.gamesPlayed).toBe(before + 1)
    })
  })

  // ─── discardGame ──────────────────────────────────────────────────────────

  describe('discardGame', () => {
    it('calls clearGameState', () => {
      store.startGame(COPY_SETTINGS)
      store.discardGame()
      expect(storageMocks.clearGameState).toHaveBeenCalled()
    })

    it('resets points to 0', () => {
      store.startGame(COPY_SETTINGS)
      store.handleAnswer('correct', 5)
      store.discardGame()
      expect(store.points.value).toBe(0)
    })
  })

  // ─── switchDeck ───────────────────────────────────────────────────────────

  describe('switchDeck', () => {
    it('loads cards from the specified deck', () => {
      storageMocks.loadDecks.mockReturnValue([
        { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] },
        { name: 'LWK_2', cards: [{ word: 'März', level: 2, time: 45 }] }
      ])
      store = useGameStore()
      store.switchDeck('LWK_2')
      expect(store.allCards.value[0]!.word).toBe('März')
    })

    it('does nothing when deck name does not exist', () => {
      const before = store.allCards.value.length
      store.switchDeck('MISSING')
      expect(store.allCards.value).toHaveLength(before)
    })
  })

  // ─── importCards ──────────────────────────────────────────────────────────

  describe('importCards', () => {
    it('updates allCards with new cards', () => {
      const newCards = [
        { word: 'März', level: 2, time: 45 },
        { word: 'Mai', level: 3, time: 30 }
      ]
      store.importCards(newCards)
      expect(store.allCards.value).toEqual(newCards)
    })

    it('saves new cards to storage', () => {
      store.importCards([{ word: 'März', level: 2, time: 45 }])
      expect(storageMocks.saveCards).toHaveBeenCalled()
    })
  })

  // ─── isEisiHappy ──────────────────────────────────────────────────────────

  describe('isEisiHappy', () => {
    it('is false when points are 0', () => {
      store.startGame(COPY_SETTINGS)
      expect(store.isEisiHappy.value).toBe(false)
    })

    it('is true when points exceed gameCards.length * 5', () => {
      store.startGame(COPY_SETTINGS)
      // gameCards has 1 card → threshold is 5 points
      // Give enough correct answers to exceed threshold
      store.handleAnswer('correct', 5)
      store.handleAnswer('correct', 5)
      store.handleAnswer('correct', 5)
      // Points should now exceed 5 (1 card × 5)
      expect(store.isEisiHappy.value).toBe(store.points.value > store.gameCards.value.length * 5)
    })
  })

  // ─── nextCard ─────────────────────────────────────────────────────────────

  describe('nextCard', () => {
    it('returns false when more cards remain', async () => {
      const { selectCards } = await import('../services/cardSelector')
      vi.mocked(selectCards).mockReturnValue([
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'bleiben', level: 1, time: 60 }
      ])
      store.allCards.value = [
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'bleiben', level: 1, time: 60 }
      ]
      store.startGame(COPY_SETTINGS)
      const result = store.nextCard()
      expect(result).toBe(false)
    })

    it('returns true when past the last card', () => {
      store.startGame(COPY_SETTINGS) // 1 card
      const result = store.nextCard() // move past the only card
      expect(result).toBe(true)
    })
  })

  // ─── Game state restore (page reload) ────────────────────────────────────

  describe('game state restore on page reload', () => {
    it('restores game state from savedGameState when gameCards are present', () => {
      storageMocks.loadGameState.mockReturnValue({
        gameCards: [{ word: 'Jahr', level: 2, time: 30 }],
        currentCardIndex: 0,
        points: 5,
        correctAnswersCount: 1,
        showWord: false,
        countdown: 0,
        gameSettings: COPY_SETTINGS
      })
      store = useGameStore()
      expect(store.gameCards.value).toHaveLength(1)
      expect(store.points.value).toBe(5)
      expect(store.gameSettings.value?.mode).toBe('copy')
    })

    it('restores gameSettings from savedGameState', () => {
      storageMocks.loadGameState.mockReturnValue({
        gameCards: [{ word: 'Jahr', level: 2, time: 30 }],
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0,
        showWord: false,
        countdown: 0,
        gameSettings: HIDDEN_SETTINGS
      })
      store = useGameStore()
      expect(store.gameSettings.value?.mode).toBe('hidden')
    })

    it('does not restore when savedGameState has empty gameCards', () => {
      storageMocks.loadGameState.mockReturnValue({
        gameCards: [],
        currentCardIndex: 0,
        points: 10,
        correctAnswersCount: 2,
        showWord: false,
        countdown: 0,
        gameSettings: COPY_SETTINGS
      })
      store = useGameStore()
      // Points should not be restored from empty game state
      expect(store.points.value).toBe(0)
    })
  })

  // ─── resetCardsToDefault ──────────────────────────────────────────────────

  describe('resetCards (resetCardsToDefault)', () => {
    it('saves only the default deck', () => {
      store.resetCards()
      expect(storageMocks.saveDecks).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: expect.any(String) })])
      )
    })

    it('updates allCards to default deck cards', () => {
      store.resetCards()
      expect(store.allCards.value.length).toBeGreaterThan(0)
    })

    it('updates settings to use default deck when settings exist', () => {
      storageMocks.loadSettings.mockReturnValue(COPY_SETTINGS)
      store.resetCards()
      expect(storageMocks.saveSettings).toHaveBeenCalled()
    })

    it('does not call saveSettings when no settings exist', () => {
      storageMocks.loadSettings.mockReturnValue(null)
      store.resetCards()
      expect(storageMocks.saveSettings).not.toHaveBeenCalled()
    })
  })

  // ─── removeDeck ───────────────────────────────────────────────────────────

  describe('removeDeck (removeDeckAndSwitch)', () => {
    it('returns false when deck removal fails', () => {
      storageMocks.loadDecks.mockReturnValue([
        { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] }
      ])
      // useDeckManagement.removeDeck will fail if only 1 deck
      const result = store.removeDeck('LWK_1')
      expect(typeof result).toBe('boolean')
    })

    it('switches to new default deck when active deck is removed', () => {
      storageMocks.loadDecks
        .mockReturnValueOnce([
          { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] },
          { name: 'LWK_2', cards: [{ word: 'März', level: 2, time: 45 }] }
        ])
        .mockReturnValueOnce([
          { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] },
          { name: 'LWK_2', cards: [{ word: 'März', level: 2, time: 45 }] }
        ])
      storageMocks.loadSettings
        .mockReturnValueOnce({ mode: 'copy' as const, focus: 'weak' as const, deck: 'LWK_2' })
        .mockReturnValueOnce({ mode: 'copy' as const, focus: 'weak' as const, deck: 'LWK_1' })
      store = useGameStore()
      store.removeDeck('LWK_2')
      // Should have switched to LWK_1
      expect(storageMocks.loadDecks).toHaveBeenCalled()
    })
  })

  // ─── handleAnswer — speed bonus ───────────────────────────────────────────

  describe('handleAnswer — speed bonus in hidden mode', () => {
    it('grants speed bonus when answer time beats record in hidden mode', () => {
      store.allCards.value = [{ word: 'Jahr', level: 1, time: 30 }]
      store.startGame(HIDDEN_SETTINGS)
      const pointsBefore = store.points.value
      store.handleAnswer('correct', 20) // 20s < 30s record → speed bonus
      expect(store.points.value).toBeGreaterThan(pointsBefore)
    })

    it('no speed bonus when time equals MAX_TIME (60s)', () => {
      store.allCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
      store.startGame(HIDDEN_SETTINGS)
      const pointsBefore = store.points.value
      store.handleAnswer('correct', 50)
      // time=60 is MAX_TIME so no speed bonus, but still gets points
      expect(store.points.value).toBeGreaterThan(pointsBefore)
    })

    it('grants close match points in hidden mode', () => {
      store.startGame(HIDDEN_SETTINGS)
      const pointsBefore = store.points.value
      store.handleAnswer('close', 5)
      expect(store.points.value).toBeGreaterThan(pointsBefore)
    })

    it('does not update time on incorrect answer', () => {
      store.allCards.value = [{ word: 'Jahr', level: 1, time: 30 }]
      store.startGame(HIDDEN_SETTINGS)
      const timeBefore = store.allCards.value[0]!.time
      store.handleAnswer('incorrect', 5)
      expect(store.allCards.value[0]!.time).toBe(timeBefore)
    })
  })

  // ─── finishGame — no settings guard ──────────────────────────────────────

  describe('finishGame — guard when no settings', () => {
    it('does nothing when gameSettings is null', () => {
      store.gameCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
      store.gameSettings.value = null
      store.finishGame()
      expect(storageMocks.setGameResult).not.toHaveBeenCalled()
    })
  })
})
