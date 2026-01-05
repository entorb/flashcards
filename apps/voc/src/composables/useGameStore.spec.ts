// cspell:ignore guten
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CardDeck } from '../types'
import { useGameStore } from './useGameStore'

// Mock storage functions
vi.mock('../services/storage', () => ({
  loadDecks: vi.fn(() => [
    {
      name: 'en',
      cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
    }
  ]),
  saveDecks: vi.fn(),
  loadCards: vi.fn(() => [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]),
  saveCards: vi.fn(),
  loadLastSettings: vi.fn(() => ({
    mode: 'multiple-choice',
    focus: 'weak',
    language: 'voc-de',
    deck: 'en'
  })),
  saveLastSettings: vi.fn(),
  loadGameStats: vi.fn(() => ({ points: 0, correctAnswers: 0, gamesPlayed: 0 })),
  saveGameStats: vi.fn(),
  updateStatistics: vi.fn(),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
  addHistory: vi.fn(),
  incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
  saveGameSettings: vi.fn(),
  loadGameSettings: vi.fn(() => null),
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  clearGameState: vi.fn(),
  setGameResult: vi.fn(),
  getGameResult: vi.fn(() => null),
  clearGameResult: vi.fn()
}))

describe('useGameStore - Deck Operations', () => {
  let store: ReturnType<typeof useGameStore>

  beforeEach(() => {
    vi.clearAllMocks()
    store = useGameStore()
  })

  describe('getDecks', () => {
    it('should return all decks', () => {
      const decks = store.getDecks()
      expect(decks).toHaveLength(1)
      expect(decks[0].name).toBe('en')
    })
  })

  describe('addDeck', () => {
    it('should add a new deck with INITIAL_CARDS', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')
      const { INITIAL_CARDS } = await import('../constants')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.addDeck('fr')

      expect(success).toBe(true)
      const saveDecksCall = vi.mocked(saveDecks).mock.calls[0][0]
      expect(saveDecksCall).toHaveLength(2)
      expect(saveDecksCall[0].name).toBe('en')
      expect(saveDecksCall[1].name).toBe('fr')
      expect(saveDecksCall[1].cards).toEqual(INITIAL_CARDS)
    })

    it('should not add deck with duplicate name', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.addDeck('en')

      expect(success).toBe(false)
      expect(saveDecks).not.toHaveBeenCalled()
    })
  })

  describe('removeDeck', () => {
    it('should remove a deck', async () => {
      const { loadDecks, saveDecks, loadLastSettings } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        {
          name: 'fr',
          cards: [{ voc: 'bonjour', de: 'guten Tag', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
      vi.mocked(loadLastSettings).mockReturnValueOnce({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })

      const success = store.removeDeck('fr')

      expect(success).toBe(true)
      expect(saveDecks).toHaveBeenCalledWith([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
    })

    it('should not remove last deck', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.removeDeck('en')

      expect(success).toBe(false)
      expect(saveDecks).not.toHaveBeenCalled()
    })

    it('should update settings when current deck is removed', async () => {
      const { loadDecks, loadLastSettings, saveLastSettings, loadCards } =
        await import('../services/storage')

      const testDecks: CardDeck[] = [
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        {
          name: 'fr',
          cards: [{ voc: 'bonjour', de: 'guten Tag', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ]
      vi.mocked(loadDecks).mockReturnValue(testDecks)
      vi.mocked(loadLastSettings).mockReturnValue({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'fr'
      })
      vi.mocked(loadCards).mockReturnValue([
        { voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }
      ])

      const success = store.removeDeck('fr')

      expect(success).toBe(true)
      expect(saveLastSettings).toHaveBeenCalledWith({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })
    })

    it('should not remove non-existent deck', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.removeDeck('nonexistent')

      expect(success).toBe(false)
      expect(saveDecks).not.toHaveBeenCalled()
    })
  })

  describe('renameDeck', () => {
    it('should rename a deck', async () => {
      const { loadDecks, saveDecks, loadLastSettings } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
      vi.mocked(loadLastSettings).mockReturnValueOnce({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'fr'
      })

      const success = store.renameDeck('en', 'english')

      expect(success).toBe(true)
      expect(saveDecks).toHaveBeenCalledWith([
        {
          name: 'english',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
    })

    it('should not rename to duplicate name', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        {
          name: 'fr',
          cards: [{ voc: 'bonjour', de: 'guten Tag', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.renameDeck('en', 'fr')

      expect(success).toBe(false)
      expect(saveDecks).not.toHaveBeenCalled()
    })

    it('should update settings when current deck is renamed', async () => {
      const { loadDecks, loadLastSettings, saveLastSettings } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
      vi.mocked(loadLastSettings).mockReturnValueOnce({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })

      const success = store.renameDeck('en', 'english')

      expect(success).toBe(true)
      expect(saveLastSettings).toHaveBeenCalledWith({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'english'
      })
    })

    it('should not rename non-existent deck', async () => {
      const { loadDecks, saveDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      const success = store.renameDeck('nonexistent', 'test')

      expect(success).toBe(false)
      expect(saveDecks).not.toHaveBeenCalled()
    })
  })

  describe('switchDeck', () => {
    it('should switch to a different deck', async () => {
      const { loadDecks } = await import('../services/storage')

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        {
          name: 'fr',
          cards: [{ voc: 'bonjour', de: 'guten Tag', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      store.switchDeck('fr')

      expect(store.allCards.value).toHaveLength(1)
      expect(store.allCards.value[0].voc).toBe('bonjour')
    })

    it('should do nothing when deck not found', async () => {
      const { loadDecks } = await import('../services/storage')

      // Get initial state
      const initialCards = store.allCards.value

      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])

      store.switchDeck('nonexistent')

      // Cards should remain unchanged
      expect(store.allCards.value).toBe(initialCards)
    })
  })

  describe('Deck operations integration', () => {
    it('should handle full deck lifecycle', async () => {
      const { loadDecks, saveDecks, loadLastSettings } = await import('../services/storage')

      // Add new deck
      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ])
      const addResult = store.addDeck('fr')
      expect(addResult).toBe(true)

      // Rename deck
      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        { name: 'fr', cards: [] }
      ])
      vi.mocked(loadLastSettings).mockReturnValueOnce({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })
      const renameResult = store.renameDeck('fr', 'french')
      expect(renameResult).toBe(true)

      // Remove deck
      vi.mocked(loadDecks).mockReturnValueOnce([
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        },
        { name: 'french', cards: [] }
      ])
      vi.mocked(loadLastSettings).mockReturnValueOnce({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })
      const removeResult = store.removeDeck('french')
      expect(removeResult).toBe(true)

      // Verify saveDecks was called for each operation
      expect(saveDecks).toHaveBeenCalledTimes(3)
    })
  })
})
