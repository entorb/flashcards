import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_DECKS, STORAGE_KEYS } from '../constants'
import type { Card, CardDeck, GameSettings } from '../types'
import {
  loadDecks,
  saveDecks,
  loadCards,
  saveCards,
  loadSettings,
  saveSettings,
  setGameResult,
  getGameResult,
  clearGameResult,
  incrementDailyGames
} from './storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Derive test decks from DEFAULT_DECKS for maintainability
const SAMPLE_DECKS: CardDeck[] = [
  {
    name: DEFAULT_DECKS[0]!.name,
    cards: [
      DEFAULT_DECKS[0]!.cards[0]!, // Jahr
      { ...DEFAULT_DECKS[0]!.cards[1]!, level: 2, time: 45 } // bleiben with modified level/time
    ]
  },
  {
    name: 'LWK_2',
    cards: [DEFAULT_DECKS[0]!.cards[2]!] // Januar
  }
]

const SAMPLE_SETTINGS: GameSettings = { mode: 'copy', focus: 'weak', deck: DEFAULT_DECKS[0]!.name }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk storage service', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── loadDecks ────────────────────────────────────────────────────────────

  describe('loadDecks', () => {
    it('returns DEFAULT_DECKS when localStorage is empty', () => {
      const decks = loadDecks()
      expect(decks).toEqual(DEFAULT_DECKS)
    })

    it('saves DEFAULT_DECKS to localStorage when empty', () => {
      loadDecks()
      expect(localStorage.getItem(STORAGE_KEYS.DECKS)).not.toBeNull()
    })

    it('returns stored decks when present', () => {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(SAMPLE_DECKS))
      const decks = loadDecks()
      expect(decks).toEqual(SAMPLE_DECKS)
    })

    it('returns DEFAULT_DECKS when stored value is invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.DECKS, 'not-json')
      const decks = loadDecks()
      expect(decks).toEqual(DEFAULT_DECKS)
    })
  })

  // ─── saveDecks / loadDecks round-trip ─────────────────────────────────────

  describe('saveDecks / loadDecks round-trip', () => {
    it('stores and retrieves decks correctly', () => {
      saveDecks(SAMPLE_DECKS)
      const loaded = loadDecks()
      expect(loaded).toEqual(SAMPLE_DECKS)
    })

    it('preserves deck names and card data', () => {
      saveDecks(SAMPLE_DECKS)
      const loaded = loadDecks()
      expect(loaded[0]!.name).toBe(DEFAULT_DECKS[0]!.name)
      expect(loaded[0]!.cards[0]!.word).toBe('Jahr')
      expect(loaded[1]!.name).toBe('LWK_2')
    })
  })

  // ─── loadCards ────────────────────────────────────────────────────────────

  describe('loadCards', () => {
    it('returns cards from the current deck (from settings)', () => {
      saveDecks(SAMPLE_DECKS)
      saveSettings(SAMPLE_SETTINGS) // deck = 'LWK_1'
      const cards = loadCards()
      expect(cards).toEqual(SAMPLE_DECKS[0]!.cards)
    })

    it('returns cards from first deck when no settings saved', () => {
      // Save decks that include the default deck name so loadCards can find it
      const decksWithDefault: CardDeck[] = [
        { name: DEFAULT_DECKS[0]!.name, cards: SAMPLE_DECKS[0]!.cards },
        ...SAMPLE_DECKS.slice(1)
      ]
      saveDecks(decksWithDefault)
      // No settings → falls back to DEFAULT_DECKS[0].name
      const cards = loadCards()
      expect(cards).toEqual(SAMPLE_DECKS[0]!.cards)
    })

    it('returns empty array when deck not found', () => {
      saveDecks(SAMPLE_DECKS)
      saveSettings({ mode: 'copy', focus: 'weak', deck: 'MISSING' })
      const cards = loadCards()
      expect(cards).toEqual([])
    })
  })

  // ─── saveCards / loadCards round-trip ─────────────────────────────────────

  describe('saveCards / loadCards round-trip', () => {
    it('saves cards to current deck and retrieves them', () => {
      saveDecks(SAMPLE_DECKS)
      saveSettings(SAMPLE_SETTINGS)

      const newCards: Card[] = [
        { word: 'März', level: 3, time: 30 },
        { word: 'Mai', level: 4, time: 20 }
      ]
      saveCards(newCards)
      const loaded = loadCards()
      expect(loaded).toEqual(newCards)
    })

    it('only updates the current deck, not other decks', () => {
      saveDecks(SAMPLE_DECKS)
      saveSettings(SAMPLE_SETTINGS) // deck = 'LWK_1'

      const newCards: Card[] = [{ word: 'März', level: 3, time: 30 }]
      saveCards(newCards)

      // LWK_2 should be unchanged
      const allDecks = loadDecks()
      const lwk2 = allDecks.find(d => d.name === 'LWK_2')
      expect(lwk2?.cards).toEqual(SAMPLE_DECKS[1]!.cards)
    })
  })

  // ─── loadSettings / saveSettings round-trip ───────────────────────────────

  describe('loadSettings / saveSettings round-trip', () => {
    it('returns null when no settings saved', () => {
      expect(loadSettings()).toBeNull()
    })

    it('saves and retrieves settings correctly', () => {
      saveSettings(SAMPLE_SETTINGS)
      const loaded = loadSettings()
      expect(loaded).toEqual(SAMPLE_SETTINGS)
    })

    it('preserves all settings fields', () => {
      const settings: GameSettings = { mode: 'hidden', focus: 'strong', deck: 'LWK_2' }
      saveSettings(settings)
      const loaded = loadSettings()
      expect(loaded?.mode).toBe('hidden')
      expect(loaded?.focus).toBe('strong')
      expect(loaded?.deck).toBe('LWK_2')
    })
  })

  // ─── setGameResult / getGameResult / clearGameResult round-trip ───────────

  describe('setGameResult / getGameResult / clearGameResult round-trip', () => {
    it('getGameResult returns null when nothing stored', () => {
      expect(getGameResult()).toBeNull()
    })

    it('stores and retrieves game result', () => {
      const result = { points: 42, correctAnswers: 8, totalCards: 10 }
      setGameResult(result)
      const loaded = getGameResult()
      expect(loaded).toEqual(result)
    })

    it('clearGameResult removes the stored result', () => {
      setGameResult({ points: 42, correctAnswers: 8, totalCards: 10 })
      clearGameResult()
      expect(getGameResult()).toBeNull()
    })

    it('preserves all result fields', () => {
      const result = { points: 100, correctAnswers: 10, totalCards: 10 }
      setGameResult(result)
      const loaded = getGameResult()
      expect(loaded?.points).toBe(100)
      expect(loaded?.correctAnswers).toBe(10)
      expect(loaded?.totalCards).toBe(10)
    })
  })

  // ─── incrementDailyGames ──────────────────────────────────────────────────

  describe('incrementDailyGames', () => {
    it('returns isFirstGame=true on first call today', () => {
      const result = incrementDailyGames()
      expect(result.isFirstGame).toBe(true)
    })

    it('returns isFirstGame=false on second call same day', () => {
      incrementDailyGames()
      const result = incrementDailyGames()
      expect(result.isFirstGame).toBe(false)
    })

    it('returns gamesPlayedToday=1 on first call', () => {
      const result = incrementDailyGames()
      expect(result.gamesPlayedToday).toBe(1)
    })

    it('increments gamesPlayedToday on subsequent calls', () => {
      incrementDailyGames()
      const result = incrementDailyGames()
      expect(result.gamesPlayedToday).toBe(2)
    })
  })
})
