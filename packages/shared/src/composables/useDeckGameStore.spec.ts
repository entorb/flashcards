import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BaseCard, BaseGameHistory } from '../types'

import { createDeckGameStore, type SavedGameState } from './useDeckGameStore'

interface TestCard extends BaseCard {
  word: string
}

interface TestSettings {
  mode: string
  focus: string
  levels: number[]
  deck?: string
}

interface TestHistory extends BaseGameHistory {
  settings: TestSettings
  totalCards?: number
}

const CARD_A: TestCard = { word: 'alpha', level: 1, time: 60 }
const CARD_B: TestCard = { word: 'beta', level: 2, time: 40 }
const CARD_C: TestCard = { word: 'gamma', level: 3, time: 30 }

const SETTINGS: TestSettings = {
  mode: 'copy',
  focus: 'weak',
  levels: [1, 2, 3, 4, 5],
  deck: 'deck-a'
}

const DECKS: Array<{ name: string; cards: TestCard[] }> = [
  { name: 'deck-a', cards: [CARD_A, CARD_B] },
  { name: 'deck-b', cards: [CARD_C] }
]

const FLOW_CONFIG = {
  settingsKey: 'test-settings',
  selectedCardsKey: 'test-selected',
  gameResultKey: 'test-result',
  historyKey: 'test-history',
  statsKey: 'test-stats',
  dailyStatsKey: 'test-daily'
} as const

function createStore(
  loadGameState: () => SavedGameState<TestCard, TestSettings> | null = () => null
) {
  let settingsState: TestSettings = { ...SETTINGS }
  let decksState: Array<{ name: string; cards: TestCard[] }> = DECKS.map(d => ({
    name: d.name,
    cards: d.cards.map(c => ({ ...c }))
  }))

  const copyDecks = (): Array<{ name: string; cards: TestCard[] }> =>
    decksState.map(d => ({ name: d.name, cards: d.cards.map(c => ({ ...c })) }))

  const storage = {
    loadCards: vi.fn(() => [CARD_A, CARD_B, CARD_C].map(c => ({ ...c }))),
    saveCards: vi.fn(),
    loadHistory: vi.fn(() => []),
    saveHistory: vi.fn(),
    loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
    saveGameStats: vi.fn(),
    loadDecks: vi.fn(copyDecks),
    saveDecks: vi.fn((decks: Array<{ name: string; cards: TestCard[] }>) => {
      decksState = decks
    }),
    loadSettings: vi.fn(() => ({ ...settingsState })),
    saveSettings: vi.fn((settings: TestSettings) => {
      settingsState = { ...settings }
    }),
    loadGameState: vi.fn(loadGameState),
    saveGameState: vi.fn(),
    clearGameState: vi.fn(),
    setGameResult: vi.fn()
  }

  const useGameStore = createDeckGameStore<TestCard, TestHistory, TestSettings>({
    storage,
    gameStateFlowConfig: FLOW_CONFIG,
    getKey: card => card.word,
    selectCards: cards => cards.slice(0, 2),
    getDifficultyPoints: () => 1,
    tracksTime: () => true,
    timeBonusPredicate: () => false,
    isValidImportCard: card => card.word.trim().length > 0,
    newDeckCards: () => [{ word: 'new-card', level: 1, time: 60 }],
    getDefaultDeckName: () => 'deck-a',
    resetCards: ({ setAllCards }) => {
      setAllCards([{ ...CARD_A }])
    }
  })

  return { store: useGameStore(), storage }
}

beforeEach(() => {
  globalThis.localStorage.clear()
  globalThis.sessionStorage.clear()
})

describe('useDeckGameStore - initialization', () => {
  it('starts with empty gameCards and zero points', () => {
    const { store } = createStore()
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
  })

  it('restores game state from sessionStorage when available', () => {
    const { store } = createStore(() => ({
      gameCards: [CARD_B],
      currentCardIndex: 0,
      points: 7,
      correctAnswersCount: 2,
      gameSettings: { ...SETTINGS },
      sessionMode: 'endless-level1',
      initialCardCount: 9
    }))
    expect(store.gameCards.value).toEqual([CARD_B])
    expect(store.points.value).toBe(7)
    expect(store.correctAnswersCount.value).toBe(2)
    expect(store.sessionMode.value).toBe('endless-level1')
  })

  it('does not restore state when saved game has no cards', () => {
    const { store } = createStore(() => ({
      gameCards: [],
      currentCardIndex: 0,
      points: 5,
      correctAnswersCount: 1,
      gameSettings: { ...SETTINGS }
    }))
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
  })
})

describe('useDeckGameStore - startGame', () => {
  it('populates gameCards and resets game state', () => {
    const { store } = createStore()
    store.startGame(SETTINGS)
    expect(store.gameCards.value).toHaveLength(2)
    expect(store.points.value).toBe(0)
    expect(store.currentCardIndex.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
  })

  it('persists settings and selected cards via game state flow', () => {
    createStore().store.startGame(SETTINGS)
    const storedSettings = JSON.parse(globalThis.localStorage.getItem('test-settings') ?? 'null')
    expect(storedSettings).toEqual(SETTINGS)
    const storedCards = JSON.parse(globalThis.sessionStorage.getItem('test-selected') ?? 'null')
    expect(storedCards).toHaveLength(2)
  })

  it('saves initial game state to storage', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    expect(storage.saveGameState).toHaveBeenCalledTimes(1)
  })

  it('switches to the configured deck before selecting cards', () => {
    const { store } = createStore()
    store.startGame(SETTINGS)
    // deck-a contains CARD_A and CARD_B; both selected by selectCards
    expect(store.allCards.value).toEqual([CARD_A, CARD_B])
    expect(store.gameCards.value).toEqual([CARD_A, CARD_B])
  })

  it('ignores startGame while a game is already in progress', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    storage.saveGameState.mockClear()
    store.startGame({ ...SETTINGS, mode: 'hidden' })
    expect(storage.saveGameState).not.toHaveBeenCalled()
    expect(store.gameSettings.value?.mode).toBe('copy')
  })
})

describe('useDeckGameStore - nextCard', () => {
  it('advances the index and saves state until the last card', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    expect(store.nextCard()).toBe(false)
    expect(store.currentCardIndex.value).toBe(1)
    expect(storage.saveGameState).toHaveBeenCalledTimes(2)
    storage.saveGameState.mockClear()
    expect(store.nextCard()).toBe(true)
    expect(store.currentCardIndex.value).toBe(1)
    expect(storage.saveGameState).not.toHaveBeenCalled()
  })
})

describe('useDeckGameStore - handleAnswer', () => {
  it('awards points and raises the level on a correct answer', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    store.handleAnswer('correct', 10)
    expect(store.points.value).toBeGreaterThan(0)
    expect(store.correctAnswersCount.value).toBe(1)
    expect(store.allCards.value.find(c => c.word === 'alpha')?.level).toBe(2)
    expect(storage.saveCards).toHaveBeenCalled()
    expect(storage.saveGameStats).toHaveBeenCalled()
    expect(storage.saveGameState).toHaveBeenCalled()
  })

  it('records the answer time on a correct answer', () => {
    const { store } = createStore()
    store.startGame(SETTINGS)
    store.handleAnswer('correct', 12.34)
    expect(store.allCards.value.find(c => c.word === 'alpha')?.time).toBe(12.3)
  })

  it('lowers the level and resets time without points on an incorrect answer', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    store.handleAnswer('incorrect')
    expect(store.points.value).toBe(0)
    expect(store.correctAnswersCount.value).toBe(0)
    expect(store.allCards.value.find(c => c.word === 'alpha')?.level).toBe(1)
    expect(store.allCards.value.find(c => c.word === 'alpha')?.time).toBe(60)
    expect(storage.saveCards).toHaveBeenCalled()
  })

  it('does nothing without an active game', () => {
    const { storage, store } = createStore()
    store.handleAnswer('correct', 10)
    expect(store.points.value).toBe(0)
    expect(storage.saveCards).not.toHaveBeenCalled()
  })
})

describe('useDeckGameStore - finishGame', () => {
  it('stores result, adds history, and resets state for standard mode', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    store.handleAnswer('correct', 10)
    store.finishGame()

    expect(storage.setGameResult).toHaveBeenCalledWith({
      points: expect.any(Number),
      correctAnswers: 1,
      totalCards: 2
    })
    expect(store.history.value).toHaveLength(1)
    expect(store.history.value[0]?.totalCards).toBe(2)
    expect(storage.clearGameState).toHaveBeenCalled()
    expect(store.sessionMode.value).toBe('standard')
    expect(store.points.value).toBe(0)
    expect(store.gameCards.value).toHaveLength(0)
  })

  it('uses initialCardCount as totalCards in endless mode', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    // Simulate endless mode where all cards were mastered and removed
    store.sessionMode.value = 'endless-level1'
    store.gameCards.value = []
    store.finishGame()

    expect(storage.setGameResult).toHaveBeenCalledWith({
      points: 0,
      correctAnswers: 0,
      totalCards: 2
    })
  })
})

describe('useDeckGameStore - discardGame', () => {
  it('clears game state and resets the store', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    store.discardGame()
    expect(storage.clearGameState).toHaveBeenCalled()
    expect(store.gameCards.value).toHaveLength(0)
    expect(store.points.value).toBe(0)
    expect(store.gameSettings.value).toBeNull()
  })
})

describe('useDeckGameStore - deck operations', () => {
  it('switchDeck replaces allCards with the deck cards', () => {
    const { store } = createStore()
    store.switchDeck('deck-b')
    expect(store.allCards.value).toEqual([CARD_C])
  })

  it('switchDeck ignores unknown decks', () => {
    const { store } = createStore()
    store.switchDeck('unknown')
    expect(store.allCards.value).toEqual([CARD_A, CARD_B, CARD_C])
  })

  it('addDeck rejects duplicates and initializes new decks', () => {
    const { storage, store } = createStore()
    expect(store.addDeck('deck-a')).toBe(false)
    expect(store.addDeck('deck-c')).toBe(true)
    expect(storage.saveDecks).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        { name: 'deck-c', cards: [{ word: 'new-card', level: 1, time: 60 }] }
      ])
    )
  })

  it('removeDeck of the active deck switches to the new default', () => {
    const { store } = createStore()
    expect(store.removeDeck('deck-a')).toBe(true)
    expect(store.allCards.value).toEqual([CARD_C])
    expect(store.getDecks().map(d => d.name)).toEqual(['deck-b'])
  })

  it('renameDeck updates the active deck name in settings', () => {
    const { storage, store } = createStore()
    expect(store.renameDeck('deck-a', 'deck-x')).toBe(true)
    expect(storage.loadSettings()?.deck).toBe('deck-x')
  })
})

describe('useDeckGameStore - importCards and resetCards', () => {
  it('importCards filters invalid cards and saves', () => {
    const { storage, store } = createStore()
    store.importCards([
      { word: 'valid', level: 1, time: 60 },
      { word: '   ', level: 1, time: 60 }
    ])
    expect(store.allCards.value).toEqual([{ word: 'valid', level: 1, time: 60 }])
    expect(storage.saveCards).toHaveBeenCalled()
  })

  it('importCards ignores an empty list', () => {
    const { storage, store } = createStore()
    store.importCards([])
    expect(storage.saveCards).not.toHaveBeenCalled()
  })

  it('resetCards clears game state and applies the app reset callback', () => {
    const { storage, store } = createStore()
    store.startGame(SETTINGS)
    store.resetCards()
    expect(storage.clearGameState).toHaveBeenCalled()
    expect(store.allCards.value).toEqual([CARD_A])
  })
})
