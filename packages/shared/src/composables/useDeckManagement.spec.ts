import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BaseCard } from '../types'
import type { CardDeck, DeckSettings } from './useDeckManagement'
import { useDeckManagement } from './useDeckManagement'

type TestCard = BaseCard
type TestSettings = DeckSettings

const makeDecks = (names: string[]): Array<CardDeck<TestCard>> =>
  names.map(name => ({ name, cards: [] }))

const makeOptions = (
  decks: Array<CardDeck<TestCard>>,
  settings: TestSettings | null = { deck: decks[0]?.name ?? '' }
) => {
  const loadDecks = vi.fn(() => [...decks])
  const saveDecks = vi.fn((updated: Array<CardDeck<TestCard>>) => {
    decks.length = 0
    decks.push(...updated)
  })
  const loadSettings = vi.fn(() => (settings ? { ...settings } : null))
  const saveSettings = vi.fn()
  return { loadDecks, saveDecks, loadSettings, saveSettings }
}

describe('useDeckManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addDeck', () => {
    it('adds a new deck and returns true', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks)
      const { addDeck } = useDeckManagement(options)

      const result = addDeck('fr')

      expect(result).toBe(true)
      expect(options.saveDecks).toHaveBeenCalledOnce()
      const saved = options.saveDecks.mock.calls[0]![0]
      expect(saved.some(d => d.name === 'fr')).toBe(true)
    })

    it('returns false and does not save when deck name already exists', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks)
      const { addDeck } = useDeckManagement(options)

      const result = addDeck('en')

      expect(result).toBe(false)
      expect(options.saveDecks).not.toHaveBeenCalled()
    })
  })

  describe('renameDeck', () => {
    it('renames a deck and returns true', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks, { deck: 'other' })
      const { renameDeck } = useDeckManagement(options)

      const result = renameDeck('en', 'english')

      expect(result).toBe(true)
      expect(options.saveDecks).toHaveBeenCalledOnce()
      const saved = options.saveDecks.mock.calls[0]![0]
      expect(saved.some(d => d.name === 'english')).toBe(true)
      expect(saved.some(d => d.name === 'en')).toBe(false)
    })

    it('updates settings when the current deck is renamed', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks, { deck: 'en' })
      const { renameDeck } = useDeckManagement(options)

      renameDeck('en', 'english')

      expect(options.saveSettings).toHaveBeenCalledOnce()
      const savedSettings = options.saveSettings.mock.calls[0]![0] as TestSettings
      expect(savedSettings.deck).toBe('english')
    })

    it('does not update settings when a different deck is renamed', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks, { deck: 'fr' })
      const { renameDeck } = useDeckManagement(options)

      renameDeck('en', 'english')

      expect(options.saveSettings).not.toHaveBeenCalled()
    })

    it('returns false when the new name already exists', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks)
      const { renameDeck } = useDeckManagement(options)

      const result = renameDeck('en', 'fr')

      expect(result).toBe(false)
      expect(options.saveDecks).not.toHaveBeenCalled()
    })

    it('returns false when the old deck does not exist', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks)
      const { renameDeck } = useDeckManagement(options)

      const result = renameDeck('nonexistent', 'new')

      expect(result).toBe(false)
      expect(options.saveDecks).not.toHaveBeenCalled()
    })
  })

  describe('removeDeck', () => {
    it('removes a deck and returns true when more than one deck exists', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks, { deck: 'en' })
      const { removeDeck } = useDeckManagement(options)

      const result = removeDeck('fr')

      expect(result).toBe(true)
      expect(options.saveDecks).toHaveBeenCalledOnce()
      const saved = options.saveDecks.mock.calls[0]![0]
      expect(saved.some(d => d.name === 'fr')).toBe(false)
    })

    it('returns false when only one deck exists', () => {
      const decks = makeDecks(['en'])
      const options = makeOptions(decks)
      const { removeDeck } = useDeckManagement(options)

      const result = removeDeck('en')

      expect(result).toBe(false)
      expect(options.saveDecks).not.toHaveBeenCalled()
    })

    it('updates settings to first remaining deck when current deck is removed', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks, { deck: 'en' })
      const { removeDeck } = useDeckManagement(options)

      removeDeck('en')

      expect(options.saveSettings).toHaveBeenCalledOnce()
      const savedSettings = options.saveSettings.mock.calls[0]![0] as TestSettings
      expect(savedSettings.deck).toBe('fr')
    })

    it('does not update settings when a non-current deck is removed', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks, { deck: 'en' })
      const { removeDeck } = useDeckManagement(options)

      removeDeck('fr')

      expect(options.saveSettings).not.toHaveBeenCalled()
    })

    it('returns false when the deck to remove does not exist', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks)
      const { removeDeck } = useDeckManagement(options)

      const result = removeDeck('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('getDecks', () => {
    it('returns the current list of decks', () => {
      const decks = makeDecks(['en', 'fr'])
      const options = makeOptions(decks)
      const { getDecks } = useDeckManagement(options)

      const result = getDecks()

      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('en')
      expect(result[1]!.name).toBe('fr')
    })
  })
})
