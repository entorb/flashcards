// cspell:ignore guten
import { beforeEach, describe, expect, it } from 'vitest'

import { INITIAL_CARDS } from '../constants'
import type { Card, CardDeck } from '../types'
import {
  getCurrentDeckName,
  loadCards,
  loadDecks,
  saveCards,
  saveDecks,
  saveLastSettings
} from './storage'

describe('Deck Storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadDecks', () => {
    it('should return default deck when no storage exists', () => {
      const decks = loadDecks()
      expect(decks).toHaveLength(1)
      expect(decks[0].name).toBe('en')
      expect(decks[0].cards).toEqual(INITIAL_CARDS)
    })

    it('should load existing decks from storage', () => {
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
      localStorage.setItem('voc-cards', JSON.stringify(testDecks))

      const decks = loadDecks()
      expect(decks).toHaveLength(2)
      expect(decks[0].name).toBe('en')
      expect(decks[1].name).toBe('fr')
      expect(decks[0].cards[0].voc).toBe('hello')
    })

    it('should handle invalid storage data', () => {
      localStorage.setItem('voc-cards', 'invalid json')

      const decks = loadDecks()
      expect(decks).toHaveLength(1)
      expect(decks[0].name).toBe('en')
      expect(decks[0].cards).toEqual(INITIAL_CARDS)
    })

    it('should handle empty array in storage', () => {
      localStorage.setItem('voc-cards', '[]')

      const decks = loadDecks()
      expect(decks).toHaveLength(1)
      expect(decks[0].name).toBe('en')
      expect(decks[0].cards).toEqual(INITIAL_CARDS)
    })
  })

  describe('saveDecks', () => {
    it('should save decks to localStorage', () => {
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

      saveDecks(testDecks)

      const stored = localStorage.getItem('voc-cards')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('en')
      expect(parsed[1].name).toBe('fr')
    })
  })

  describe('getCurrentDeckName', () => {
    it('should return default deck name when no settings exist', () => {
      const deckName = getCurrentDeckName()
      expect(deckName).toBe('en')
    })

    it('should return deck name from settings', () => {
      saveLastSettings({ mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: 'fr' })

      const deckName = getCurrentDeckName()
      expect(deckName).toBe('fr')
    })

    it('should return default when settings exist but deck is not set', () => {
      saveLastSettings({ mode: 'multiple-choice', focus: 'weak', language: 'voc-de' })

      const deckName = getCurrentDeckName()
      expect(deckName).toBe('en')
    })
  })

  describe('loadCards', () => {
    it('should load cards from current deck', () => {
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
      saveDecks(testDecks)
      saveLastSettings({ mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: 'fr' })

      const cards = loadCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].voc).toBe('bonjour')
    })

    it('should load from first deck when current deck not found', () => {
      const testDecks: CardDeck[] = [
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ]
      saveDecks(testDecks)
      saveLastSettings({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'nonexistent'
      })

      const cards = loadCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].voc).toBe('hello')
    })
  })

  describe('saveCards', () => {
    it('should save cards to current deck', () => {
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
      saveDecks(testDecks)
      saveLastSettings({ mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: 'fr' })

      const newCards: Card[] = [
        { voc: 'merci', de: 'danke', level: 2, time_blind: 10, time_typing: 10 }
      ]
      saveCards(newCards)

      const decks = loadDecks()
      expect(decks[1].cards).toHaveLength(1)
      expect(decks[1].cards[0].voc).toBe('merci')
      // Verify first deck unchanged
      expect(decks[0].cards[0].voc).toBe('hello')
    })

    it('should not save when deck does not exist', () => {
      const testDecks: CardDeck[] = [
        {
          name: 'en',
          cards: [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
        }
      ]
      saveDecks(testDecks)
      saveLastSettings({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'nonexistent'
      })

      const newCards: Card[] = [
        { voc: 'test', de: 'Test', level: 1, time_blind: 5, time_typing: 5 }
      ]
      saveCards(newCards)

      // Verify original deck unchanged
      const decks = loadDecks()
      expect(decks[0].cards[0].voc).toBe('hello')
    })
  })

  describe('Migration edge cases', () => {
    it('should handle cards with new structure (voc field)', () => {
      const newCards = [{ voc: 'hello', de: 'hallo', level: 1, time_blind: 5, time_typing: 5 }]
      localStorage.setItem('voc-cards', JSON.stringify(newCards))

      const decks = loadDecks()
      expect(decks).toHaveLength(1)
      expect(decks[0].cards[0].voc).toBe('hello')
    })
  })
})
