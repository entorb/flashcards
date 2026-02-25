import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Card, CardDeck, GameSettings } from '../types'

// Reset modules before each test to get a fresh singleton baseStore
beforeEach(() => {
  vi.resetModules()
})

// Sample cards for mocking
const MOCK_CARDS: Card[] = [
  { voc: 'Where', de: 'Wo', level: 1, time: 60 },
  { voc: 'Who', de: 'Wer', level: 2, time: 45 },
  { voc: 'What', de: 'Was', level: 3, time: 30 }
]

const MOCK_DECKS: CardDeck[] = [
  { name: 'en', cards: MOCK_CARDS },
  { name: 'de', cards: [{ voc: 'Hallo', de: 'Hello', level: 1, time: 60 }] }
]

const DEFAULT_SETTINGS: GameSettings = {
  mode: 'multiple-choice',
  focus: 'medium',
  language: 'voc-de',
  deck: 'en'
}

// Storage mock factory - called after resetModules in each test
async function setupMocks(overrides: Record<string, unknown> = {}) {
  vi.doMock('@/services/storage', () => ({
    loadCards: vi.fn(() => [...MOCK_CARDS]),
    loadHistory: vi.fn(() => []),
    saveHistory: vi.fn(),
    loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
    saveGameStats: vi.fn(),
    saveCards: vi.fn(),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    loadGameState: vi.fn(() => null),
    setGameResult: vi.fn(),
    loadDecks: vi.fn(() => [...MOCK_DECKS]),
    saveDecks: vi.fn(),
    loadSettings: vi.fn(() => ({ ...DEFAULT_SETTINGS })),
    saveSettings: vi.fn(),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
    getGameResult: vi.fn(() => null),
    clearGameResult: vi.fn(),
    ...overrides
  }))

  vi.doMock('@/services/cardSelector', () => ({
    selectCardsForRound: vi.fn(() => [...MOCK_CARDS])
  }))

  const { useGameStore } = await import('./useGameStore')
  return useGameStore()
}

// ============================================================================
// Initialization
// ============================================================================

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
        gameCards: [{ voc: 'Where', de: 'Wo', level: 2, time: 45 }],
        currentCardIndex: 0,
        points: 10,
        correctAnswersCount: 1,
        gameSettings: DEFAULT_SETTINGS
      }))
    })
    expect(store.gameCards.value).toHaveLength(1)
    expect(store.points.value).toBe(10)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('restores game settings from saved state', async () => {
    const savedSettings: GameSettings = {
      mode: 'typing',
      focus: 'weak',
      language: 'de-voc',
      deck: 'de'
    }
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: [{ voc: 'Where', de: 'Wo', level: 1, time: 60 }],
        currentCardIndex: 0,
        points: 5,
        correctAnswersCount: 1,
        gameSettings: savedSettings
      }))
    })
    expect(store.gameSettings.value).toEqual(savedSettings)
  })

  it('does not restore state when savedGameState has no cards', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: [],
        currentCardIndex: 0,
        points: 5,
        correctAnswersCount: 1,
        gameSettings: DEFAULT_SETTINGS
      }))
    })
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
  })

  it('does not restore state when loadGameState returns null', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => null)
    })
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
  })
})

// ============================================================================
// startGame
// ============================================================================

describe('useGameStore - startGame', () => {
  it('populates gameCards after startGame', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('resets points and index on new game', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    expect(store.points.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('saves settings via saveSettings', async () => {
    const store = await setupMocks()
    const { saveSettings } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
    expect(saveSettings).toHaveBeenCalledWith(DEFAULT_SETTINGS)
  })

  it('saves initial game state to sessionStorage', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
    expect(saveGameState).toHaveBeenCalled()
  })

  it('calls selectCardsForRound with allCards and focus', async () => {
    const store = await setupMocks()
    const { selectCardsForRound } = await import('@/services/cardSelector')
    store.startGame(DEFAULT_SETTINGS)
    expect(selectCardsForRound).toHaveBeenCalledWith(expect.any(Array), DEFAULT_SETTINGS.focus)
  })

  it('does not restart game if gameCards already populated (page reload)', async () => {
    const store = await setupMocks({
      loadGameState: vi.fn(() => ({
        gameCards: MOCK_CARDS,
        currentCardIndex: 1,
        points: 5,
        correctAnswersCount: 1,
        gameSettings: DEFAULT_SETTINGS
      }))
    })
    // gameCards already restored from session storage
    const initialCards = store.gameCards.value
    store.startGame(DEFAULT_SETTINGS)
    // Should not overwrite existing game
    expect(store.gameCards.value).toBe(initialCards)
  })

  it('starts game with blind mode', async () => {
    const store = await setupMocks()
    const blindSettings: GameSettings = { ...DEFAULT_SETTINGS, mode: 'blind' }
    store.startGame(blindSettings)
    expect(store.gameSettings.value?.mode).toBe('blind')
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('starts game with typing mode', async () => {
    const store = await setupMocks()
    const typingSettings: GameSettings = { ...DEFAULT_SETTINGS, mode: 'typing' }
    store.startGame(typingSettings)
    expect(store.gameSettings.value?.mode).toBe('typing')
    expect(store.gameCards.value.length).toBeGreaterThan(0)
  })

  it('starts game with de-voc language direction', async () => {
    const store = await setupMocks()
    const deVocSettings: GameSettings = { ...DEFAULT_SETTINGS, language: 'de-voc' }
    store.startGame(deVocSettings)
    expect(store.gameSettings.value?.language).toBe('de-voc')
  })

  it('switches deck when settings include a deck name', async () => {
    const store = await setupMocks()
    const settingsWithDeck: GameSettings = { ...DEFAULT_SETTINGS, deck: 'de' }
    store.startGame(settingsWithDeck)
    // switchDeck loads cards from the specified deck
    expect(store.allCards.value).toBeDefined()
  })
})

// ============================================================================
// currentCard
// ============================================================================

describe('useGameStore - currentCard', () => {
  it('returns null when no game is active', async () => {
    const store = await setupMocks()
    expect(store.currentCard.value).toBeNull()
  })

  it('returns first card after game starts', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    expect(store.currentCard.value).not.toBeNull()
    expect(store.currentCard.value?.voc).toBeDefined()
  })
})

// ============================================================================
// handleAnswer - multiple-choice mode
// ============================================================================

describe('useGameStore - handleAnswer (multiple-choice mode)', () => {
  it('grants points for correct answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const initialPoints = store.points.value

    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })

  it('increments correctAnswersCount for correct answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('correct', 5)
    expect(store.correctAnswersCount.value).toBe(1)
  })

  it('does not grant points for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const initialPoints = store.points.value

    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('does not increment correctAnswersCount for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('incorrect', 5)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('increments card level for correct answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const card = store.currentCard.value!
    const initialLevel = card.level

    store.handleAnswer('correct', 5)
    const updatedCard = store.allCards.value.find(c => c.voc === card.voc)
    expect(updatedCard?.level).toBe(Math.min(5, initialLevel + 1))
  })

  it('decrements card level for incorrect answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const card = store.currentCard.value!
    const initialLevel = card.level

    store.handleAnswer('incorrect', 5)
    const updatedCard = store.allCards.value.find(c => c.voc === card.voc)
    expect(updatedCard?.level).toBe(Math.max(1, initialLevel - 1))
  })

  it('saves cards after answer', async () => {
    const store = await setupMocks()
    const { saveCards } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
    vi.mocked(saveCards).mockClear()

    store.handleAnswer('correct', 5)
    expect(saveCards).toHaveBeenCalled()
  })

  it('saves game state after answer', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
    vi.mocked(saveGameState).mockClear()

    store.handleAnswer('correct', 5)
    expect(saveGameState).toHaveBeenCalled()
  })

  it('does nothing when no current card (no game started)', async () => {
    const store = await setupMocks()
    const { saveCards } = await import('@/services/storage')

    store.handleAnswer('correct', 5)
    expect(saveCards).not.toHaveBeenCalled()
  })

  it('sets lastPointsBreakdown after correct answer', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('correct', 5)
    expect(store.lastPointsBreakdown.value).not.toBeNull()
    expect(store.lastPointsBreakdown.value?.totalPoints).toBeGreaterThan(0)
  })
})

// ============================================================================
// handleAnswer - typing mode
// ============================================================================

describe('useGameStore - handleAnswer (typing mode)', () => {
  const typingSettings: GameSettings = { ...DEFAULT_SETTINGS, mode: 'typing' }

  it('grants more points for correct answer in typing mode', async () => {
    const mcStore = await setupMocks()
    mcStore.startGame(DEFAULT_SETTINGS)
    mcStore.handleAnswer('correct', 5)
    const mcPoints = mcStore.points.value

    vi.resetModules()
    const typingStore = await setupMocks()
    typingStore.startGame(typingSettings)
    typingStore.handleAnswer('correct', 5)
    const typingPoints = typingStore.points.value

    expect(typingPoints).toBeGreaterThan(mcPoints)
  })

  it('grants points for close answer in typing mode', async () => {
    const store = await setupMocks()
    store.startGame(typingSettings)
    const initialPoints = store.points.value

    store.handleAnswer('close', 5)
    expect(store.points.value).toBeGreaterThanOrEqual(initialPoints)
  })

  it('does not increment correctAnswersCount for close answer', async () => {
    const store = await setupMocks()
    store.startGame(typingSettings)

    store.handleAnswer('close', 5)
    // close does not count as a correct answer
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('does not change card level for close answer', async () => {
    const store = await setupMocks()
    store.startGame(typingSettings)
    const card = store.currentCard.value!
    const initialLevel = card.level

    store.handleAnswer('close', 5)
    const updatedCard = store.allCards.value.find(c => c.voc === card.voc)
    expect(updatedCard?.level).toBe(initialLevel)
  })

  it('updates card time on correct answer', async () => {
    const store = await setupMocks()
    store.startGame(typingSettings)
    const card = store.currentCard.value!

    store.handleAnswer('correct', 10)
    const updatedCard = store.allCards.value.find(c => c.voc === card.voc)
    expect(updatedCard?.time).toBeDefined()
  })
})

// ============================================================================
// handleAnswer - blind mode
// ============================================================================

describe('useGameStore - handleAnswer (blind mode)', () => {
  const blindSettings: GameSettings = { ...DEFAULT_SETTINGS, mode: 'blind' }

  it('grants points for correct answer in blind mode', async () => {
    const store = await setupMocks()
    store.startGame(blindSettings)
    const initialPoints = store.points.value

    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })

  it('does not grant points for incorrect answer in blind mode', async () => {
    const store = await setupMocks()
    store.startGame(blindSettings)
    const initialPoints = store.points.value

    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })
})

// ============================================================================
// handleAnswer - language direction bonus
// ============================================================================

describe('useGameStore - handleAnswer (language direction)', () => {
  it('grants language bonus for correct answer in de-voc direction', async () => {
    const deVocSettings: GameSettings = { ...DEFAULT_SETTINGS, language: 'de-voc' }
    const vocDeSettings: GameSettings = { ...DEFAULT_SETTINGS, language: 'voc-de' }

    const deVocStore = await setupMocks()
    deVocStore.startGame(deVocSettings)
    deVocStore.handleAnswer('correct', 5)
    const deVocPoints = deVocStore.points.value

    vi.resetModules()
    const vocDeStore = await setupMocks()
    vocDeStore.startGame(vocDeSettings)
    vocDeStore.handleAnswer('correct', 5)
    const vocDePoints = vocDeStore.points.value

    expect(deVocPoints).toBeGreaterThan(vocDePoints)
  })
})

// ============================================================================
// nextCard
// ============================================================================

describe('useGameStore - nextCard', () => {
  it('advances currentCardIndex', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    expect(store.currentCardIndex.value).toBe(0)

    store.nextCard()
    expect(store.currentCardIndex.value).toBe(1)
  })

  it('returns false when more cards remain', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    // 3 cards in mock, first nextCard should not be game over
    const isOver = store.nextCard()
    expect(isOver).toBe(false)
  })

  it('returns true when all cards are exhausted', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    // 3 cards in mock: advance past all of them
    store.nextCard() // index 1
    store.nextCard() // index 2
    const isOver = store.nextCard() // index 3 >= length 3
    expect(isOver).toBe(true)
  })

  it('saves game state after advancing (when not game over)', async () => {
    const store = await setupMocks()
    const { saveGameState } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
    vi.mocked(saveGameState).mockClear()

    store.nextCard()
    expect(saveGameState).toHaveBeenCalled()
  })
})

// ============================================================================
// finishGame
// ============================================================================

describe('useGameStore - finishGame', () => {
  it('saves game result to sessionStorage', async () => {
    const store = await setupMocks()
    const { setGameResult } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)
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
    store.startGame(DEFAULT_SETTINGS)

    store.finishGame()
    expect(clearGameState).toHaveBeenCalled()
  })

  it('resets in-memory game state after finishing', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    store.handleAnswer('correct', 5)

    store.finishGame()
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('clears gameCards after finishing to prevent 11/10 bug', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.finishGame()
    expect(store.gameCards.value).toHaveLength(0)
  })

  it('does nothing when no game settings', async () => {
    const store = await setupMocks()
    // No game started
    expect(() => {
      store.finishGame()
    }).not.toThrow()
  })

  it('adds entry to history', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const initialHistoryLength = store.history.value.length

    store.finishGame()
    expect(store.history.value).toHaveLength(initialHistoryLength + 1)
  })
})

// ============================================================================
// discardGame
// ============================================================================

describe('useGameStore - discardGame', () => {
  it('clears game state from sessionStorage', async () => {
    const store = await setupMocks()
    const { clearGameState } = await import('@/services/storage')
    store.startGame(DEFAULT_SETTINGS)

    store.discardGame()
    expect(clearGameState).toHaveBeenCalled()
  })

  it('resets in-memory game state', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    store.handleAnswer('correct', 5)

    store.discardGame()
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
  })
})

// ============================================================================
// Deck operations
// ============================================================================

describe('useGameStore - deck operations', () => {
  it('getDecks returns all decks', async () => {
    const store = await setupMocks()
    const decks = store.getDecks()
    expect(decks).toHaveLength(2)
    expect(decks[0]!.name).toBe('en')
    expect(decks[1]!.name).toBe('de')
  })

  it('addDeck creates a new deck with INITIAL_CARDS', async () => {
    const store = await setupMocks()
    const { saveDecks } = await import('@/services/storage')

    const result = store.addDeck('fr')
    expect(result).toBe(true)
    expect(saveDecks).toHaveBeenCalled()
  })

  it('addDeck returns false for duplicate deck name', async () => {
    const store = await setupMocks()
    const result = store.addDeck('en') // 'en' already exists in MOCK_DECKS
    expect(result).toBe(false)
  })

  it('switchDeck loads cards from the specified deck', async () => {
    const store = await setupMocks()
    store.switchDeck('de')
    // After switching to 'de' deck, allCards should be the 'de' deck cards
    expect(store.allCards.value).toEqual(MOCK_DECKS[1]!.cards)
  })

  it('switchDeck does nothing for unknown deck', async () => {
    const store = await setupMocks()
    const initialCards = store.allCards.value
    store.switchDeck('nonexistent')
    expect(store.allCards.value).toEqual(initialCards)
  })

  it('removeDeck removes an existing deck', async () => {
    const store = await setupMocks()
    const { saveDecks } = await import('@/services/storage')

    const result = store.removeDeck('de')
    expect(result).toBe(true)
    expect(saveDecks).toHaveBeenCalled()
  })

  it('removeDeck returns false when only one deck remains', async () => {
    const store = await setupMocks({
      loadDecks: vi.fn(() => [{ name: 'en', cards: MOCK_CARDS }])
    })
    const result = store.removeDeck('en')
    expect(result).toBe(false)
  })

  it('renameDeck renames an existing deck', async () => {
    const store = await setupMocks()
    const { saveDecks } = await import('@/services/storage')

    const result = store.renameDeck('de', 'deutsch')
    expect(result).toBe(true)
    expect(saveDecks).toHaveBeenCalled()
  })

  it('renameDeck returns false for duplicate name', async () => {
    const store = await setupMocks()
    const result = store.renameDeck('de', 'en') // 'en' already exists
    expect(result).toBe(false)
  })

  it('renameDeck returns false for non-existent deck', async () => {
    const store = await setupMocks()
    const result = store.renameDeck('nonexistent', 'newname')
    expect(result).toBe(false)
  })
})

// ============================================================================
// importCards
// ============================================================================

describe('useGameStore - importCards', () => {
  it('replaces allCards with imported cards', async () => {
    const store = await setupMocks()
    const newCards: Card[] = [
      { voc: 'Hello', de: 'Hallo', level: 1, time: 60 },
      { voc: 'Goodbye', de: 'Auf Wiedersehen', level: 2, time: 45 }
    ]

    store.importCards(newCards)
    expect(store.allCards.value).toEqual(newCards)
  })

  it('saves imported cards to storage', async () => {
    const store = await setupMocks()
    const { saveCards } = await import('@/services/storage')
    const newCards: Card[] = [{ voc: 'Hello', de: 'Hallo', level: 1, time: 60 }]

    store.importCards(newCards)
    expect(saveCards).toHaveBeenCalledWith(newCards)
  })
})

// ============================================================================
// moveAllCards
// ============================================================================

describe('useGameStore - moveAllCards', () => {
  it('moves all cards to specified level', async () => {
    const store = await setupMocks({
      loadCards: vi.fn(() => [
        { voc: 'Where', de: 'Wo', level: 1, time: 60 },
        { voc: 'Who', de: 'Wer', level: 3, time: 45 }
      ])
    })

    store.moveAllCards(3)

    for (const card of store.allCards.value) {
      expect(card.level).toBe(3)
    }
  })

  it('throws for invalid level (0)', async () => {
    const store = await setupMocks()
    expect(() => {
      store.moveAllCards(0)
    }).toThrow()
  })

  it('throws for invalid level (6)', async () => {
    const store = await setupMocks()
    expect(() => {
      store.moveAllCards(6)
    }).toThrow()
  })
})

// ============================================================================
// isFoxHappy computed
// ============================================================================

describe('useGameStore - isFoxHappy', () => {
  it('is false when points are low', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    // No answers given, points = 0
    expect(store.isFoxHappy.value).toBe(false)
  })

  it('is true when points exceed cards * 5', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    // Manually set points above threshold (3 cards * 5 = 15)
    store.points.value = 20
    expect(store.isFoxHappy.value).toBe(true)
  })
})

// ============================================================================
// Scoring safety invariants
// ============================================================================

describe('useGameStore - scoring safety invariants', () => {
  it('points are always non-negative after multiple incorrect answers', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('incorrect', 5)
    store.handleAnswer('incorrect', 5)
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBeGreaterThanOrEqual(0)
  })

  it('correctAnswersCount matches number of correct answers given', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('correct', 5)
    store.handleAnswer('incorrect', 5)
    store.handleAnswer('correct', 5)

    expect(store.correctAnswersCount.value).toBe(2)
  })

  it('correctAnswersCount never exceeds total cards answered', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)

    store.handleAnswer('correct', 5)
    store.handleAnswer('correct', 5)

    expect(store.correctAnswersCount.value).toBeLessThanOrEqual(store.gameCards.value.length)
  })

  it('never grants points for incorrect answers', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const initialPoints = store.points.value
    store.handleAnswer('incorrect', 5)
    expect(store.points.value).toBe(initialPoints)
  })

  it('grants points for correct answers', async () => {
    const store = await setupMocks()
    store.startGame(DEFAULT_SETTINGS)
    const initialPoints = store.points.value
    store.handleAnswer('correct', 5)
    expect(store.points.value).toBeGreaterThan(initialPoints)
  })
})
