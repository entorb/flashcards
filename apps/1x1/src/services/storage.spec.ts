import { beforeEach, describe, expect, it } from 'vitest'

import { MAX_TIME, MIN_LEVEL, MIN_TIME } from '@flashcards/shared'

import { DEFAULT_RANGE, STORAGE_KEYS } from '../constants'
import type { Card, GameSettings } from '../types'
import {
  clearGameResult,
  clearGameState,
  createDefaultCard,
  getGameConfig,
  getGameResult,
  getVirtualCardsForRange,
  incrementDailyGames,
  initializeCards,
  loadCards,
  loadGameState,
  loadGameStats,
  loadHistory,
  loadRange,
  loadSettings,
  parseCardQuestion,
  resetAll,
  resetCards,
  saveCards,
  saveGameState,
  saveHistory,
  saveRange,
  saveSettings,
  setGameConfig,
  setGameResult,
  toggleFeature,
  updateCard
} from './storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_CARD: Card = { question: '3x3', answer: 9, level: 1, time: 60 }
const SAMPLE_SETTINGS: GameSettings = { select: [3, 4, 5], focus: 'weak' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('1x1 storage service', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── parseCardQuestion ──────────────────────────────────────────────────

  describe('parseCardQuestion', () => {
    it('parses standard question format', () => {
      expect(parseCardQuestion('3x4')).toEqual({ x: 4, y: 3 })
    })

    it('parses larger numbers', () => {
      expect(parseCardQuestion('12x15')).toEqual({ x: 15, y: 12 })
    })

    it('returns zeros for invalid input', () => {
      expect(parseCardQuestion('abc')).toEqual({ x: 0, y: 0 })
    })
  })

  // ─── createDefaultCard ──────────────────────────────────────────────────

  describe('createDefaultCard', () => {
    it('creates card with correct question format', () => {
      const card = createDefaultCard(5, 3)
      expect(card.question).toBe('5x3')
    })

    it('calculates correct answer', () => {
      const card = createDefaultCard(7, 8)
      expect(card.answer).toBe(56)
    })

    it('sets default level and time', () => {
      const card = createDefaultCard(3, 3)
      expect(card.level).toBe(MIN_LEVEL)
      expect(card.time).toBe(MAX_TIME)
    })
  })

  // ─── initializeCards ────────────────────────────────────────────────────

  describe('initializeCards', () => {
    it('initializes exactly 28 cards for 3x3 to 9x9', () => {
      const cards = initializeCards()
      expect(cards).toHaveLength(28)
    })

    it('has all expected cards', () => {
      const cards = initializeCards()
      const questions = cards.map(c => c.question)
      questions.sort((a, b) => a.localeCompare(b))

      const expected: string[] = []
      for (let y = 3; y <= 9; y++) {
        for (let x = 3; x <= y; x++) {
          expected.push(`${y}x${x}`)
        }
      }

      expect(questions).toEqual(expected.sort((a, b) => a.localeCompare(b)))
    })

    it('initializes all cards with level 1 and time 60', () => {
      const cards = initializeCards()
      for (const card of cards) {
        expect(card.level).toBe(1)
        expect(card.time).toBe(60)
      }
    })

    it('saves cards to localStorage', () => {
      initializeCards()
      expect(localStorage.getItem(STORAGE_KEYS.CARDS)).not.toBeNull()
    })
  })

  // ─── loadCards ──────────────────────────────────────────────────────────

  describe('loadCards', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadCards()).toEqual([])
    })

    it('returns stored cards when present', () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([SAMPLE_CARD]))
      expect(loadCards()).toEqual([SAMPLE_CARD])
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, 'not-json')
      expect(loadCards()).toEqual([])
    })
  })

  // ─── saveCards / loadCards round-trip ────────────────────────────────────

  describe('saveCards / loadCards round-trip', () => {
    it('stores and retrieves cards correctly', () => {
      const cards = [SAMPLE_CARD, { ...SAMPLE_CARD, question: '4x3', answer: 12 }]
      saveCards(cards)
      expect(loadCards()).toEqual(cards)
    })
  })

  // ─── getVirtualCardsForRange ────────────────────────────────────────────

  describe('getVirtualCardsForRange', () => {
    it('returns virtual cards for given range', () => {
      const cards = getVirtualCardsForRange([3, 4])
      // 3x3, 4x3, 4x4 = 3 cards
      expect(cards).toHaveLength(3)
    })

    it('uses stored card data when available', () => {
      const storedCard: Card = { question: '3x3', answer: 9, level: 5, time: 10 }
      saveCards([storedCard])
      const cards = getVirtualCardsForRange([3])
      expect(cards[0]?.level).toBe(5)
      expect(cards[0]?.time).toBe(10)
    })

    it('creates default cards for missing entries', () => {
      saveCards([])
      const cards = getVirtualCardsForRange([3])
      expect(cards[0]?.level).toBe(MIN_LEVEL)
      expect(cards[0]?.time).toBe(MAX_TIME)
    })
  })

  // ─── updateCard ─────────────────────────────────────────────────────────

  describe('updateCard', () => {
    it('updates an existing card', () => {
      initializeCards()
      updateCard('3x3', { level: 3, time: 30 })
      const cards = loadCards()
      const card = cards.find(c => c.question === '3x3')
      expect(card?.level).toBe(3)
      expect(card?.time).toBe(30)
    })

    it('creates a new card if it does not exist', () => {
      saveCards([])
      updateCard('12x11', { level: 2, time: 40 })
      const cards = loadCards()
      const card = cards.find(c => c.question === '12x11')
      expect(card).toBeDefined()
      expect(card?.level).toBe(2)
      expect(card?.time).toBe(40)
      expect(card?.answer).toBe(132)
    })

    it('clamps time to MIN_TIME', () => {
      initializeCards()
      updateCard('3x3', { time: 0 })
      const cards = loadCards()
      const card = cards.find(c => c.question === '3x3')
      expect(card?.time).toBe(MIN_TIME)
    })

    it('clamps time to MAX_TIME', () => {
      initializeCards()
      updateCard('3x3', { time: 999 })
      const cards = loadCards()
      const card = cards.find(c => c.question === '3x3')
      expect(card?.time).toBe(MAX_TIME)
    })
  })

  // ─── resetCards ─────────────────────────────────────────────────────────

  describe('resetCards', () => {
    it('resets all cards to level 1 and time 60', () => {
      initializeCards()
      updateCard('3x3', { level: 5, time: 10 })
      resetCards()
      const cards = loadCards()
      for (const card of cards) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })
  })

  // ─── History operations ─────────────────────────────────────────────────

  describe('history operations', () => {
    it('loadHistory returns empty array when nothing stored', () => {
      expect(loadHistory()).toEqual([])
    })

    it('saveHistory / loadHistory round-trip', () => {
      const history = [
        {
          date: '2025-01-01',
          points: 42,
          correctAnswers: 8,
          totalCards: 10,
          settings: SAMPLE_SETTINGS
        }
      ]
      saveHistory(history)
      expect(loadHistory()).toEqual(history)
    })
  })

  // ─── Stats operations ───────────────────────────────────────────────────

  describe('stats operations', () => {
    it('loadGameStats returns defaults when nothing stored', () => {
      const stats = loadGameStats()
      expect(stats.gamesPlayed).toBe(0)
      expect(stats.points).toBe(0)
      expect(stats.correctAnswers).toBe(0)
    })
  })

  // ─── Game config (session storage) ──────────────────────────────────────

  describe('game config (session storage)', () => {
    it('getGameConfig returns null when nothing stored', () => {
      expect(getGameConfig()).toBeNull()
    })

    it('setGameConfig / getGameConfig round-trip', () => {
      setGameConfig(SAMPLE_SETTINGS)
      expect(getGameConfig()).toEqual(SAMPLE_SETTINGS)
    })
  })

  // ─── Game result (session storage) ──────────────────────────────────────

  describe('game result (session storage)', () => {
    it('getGameResult returns null when nothing stored', () => {
      expect(getGameResult()).toBeNull()
    })

    it('setGameResult / getGameResult round-trip', () => {
      const result = { points: 42, correctAnswers: 8, totalCards: 10 }
      setGameResult(result)
      expect(getGameResult()).toEqual(result)
    })

    it('clearGameResult removes the stored result', () => {
      setGameResult({ points: 42, correctAnswers: 8, totalCards: 10 })
      clearGameResult()
      expect(getGameResult()).toBeNull()
    })
  })

  // ─── incrementDailyGames ────────────────────────────────────────────────

  describe('incrementDailyGames', () => {
    it('returns isFirstGame=true on first call', () => {
      expect(incrementDailyGames().isFirstGame).toBe(true)
    })

    it('returns isFirstGame=false on second call', () => {
      incrementDailyGames()
      expect(incrementDailyGames().isFirstGame).toBe(false)
    })

    it('increments gamesPlayedToday', () => {
      incrementDailyGames()
      expect(incrementDailyGames().gamesPlayedToday).toBe(2)
    })
  })

  // ─── Game state (session storage) ───────────────────────────────────────

  describe('game state (session storage)', () => {
    it('loadGameState returns null when nothing stored', () => {
      expect(loadGameState()).toBeNull()
    })

    it('saveGameState / loadGameState round-trip', () => {
      const state = {
        gameCards: [SAMPLE_CARD],
        currentCardIndex: 0,
        points: 10,
        correctAnswersCount: 1
      }
      saveGameState(state)
      expect(loadGameState()).toEqual(state)
    })

    it('clearGameState removes the stored state', () => {
      saveGameState({
        gameCards: [SAMPLE_CARD],
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0
      })
      clearGameState()
      expect(loadGameState()).toBeNull()
    })
  })

  // ─── Range operations ───────────────────────────────────────────────────

  describe('range operations', () => {
    it('loadRange returns DEFAULT_RANGE when nothing stored', () => {
      expect(loadRange()).toEqual(DEFAULT_RANGE)
    })

    it('saveRange / loadRange round-trip', () => {
      const range = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]
      saveRange(range)
      expect(loadRange()).toEqual(range)
    })

    it('loadRange returns DEFAULT_RANGE for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.RANGE, 'not-json')
      expect(loadRange()).toEqual(DEFAULT_RANGE)
    })
  })

  // ─── Settings operations ────────────────────────────────────────────────

  describe('settings operations', () => {
    it('loadSettings returns null when nothing stored', () => {
      expect(loadSettings()).toBeNull()
    })

    it('saveSettings / loadSettings round-trip', () => {
      saveSettings(SAMPLE_SETTINGS)
      expect(loadSettings()).toEqual(SAMPLE_SETTINGS)
    })
  })

  // ─── toggleFeature ──────────────────────────────────────────────────────

  describe('toggleFeature', () => {
    const baseRange = [...DEFAULT_RANGE]

    describe('feature1x2', () => {
      it('activates: adds 2 at beginning', () => {
        const result = toggleFeature(baseRange, 'feature1x2')
        expect(result[0]).toBe(2)
        expect(result).toContain(2)
      })

      it('deactivates: removes 2', () => {
        const withTwo = [2, ...baseRange]
        const result = toggleFeature(withTwo, 'feature1x2')
        expect(result).not.toContain(2)
      })
    })

    describe('feature1x12', () => {
      it('activates: adds 11, 12', () => {
        const result = toggleFeature(baseRange, 'feature1x12')
        expect(result).toContain(11)
        expect(result).toContain(12)
      })

      it('deactivates: removes 11, 12 and also 13-20', () => {
        const extended = [...baseRange, 11, 12, 13, 14, 15]
        const result = toggleFeature(extended, 'feature1x12')
        expect(result).not.toContain(11)
        expect(result).not.toContain(12)
        expect(result).not.toContain(13)
      })
    })

    describe('feature1x20', () => {
      it('activates: adds 11-20 (auto-enables 1x12)', () => {
        const result = toggleFeature(baseRange, 'feature1x20')
        expect(result).toContain(11)
        expect(result).toContain(12)
        expect(result).toContain(20)
      })

      it('deactivates: removes 13-20 but keeps 11-12', () => {
        const extended = [...baseRange, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        const result = toggleFeature(extended, 'feature1x20')
        expect(result).toContain(11)
        expect(result).toContain(12)
        expect(result).not.toContain(13)
      })
    })
  })

  // ─── resetAll ───────────────────────────────────────────────────────────

  describe('resetAll', () => {
    it('clears all storage keys', () => {
      initializeCards()
      saveSettings(SAMPLE_SETTINGS)
      saveRange([2, ...DEFAULT_RANGE])
      setGameResult({ points: 42, correctAnswers: 8, totalCards: 10 })

      resetAll()

      expect(localStorage.getItem(STORAGE_KEYS.CARDS)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.HISTORY)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.STATS)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.SETTINGS)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.DAILY_STATS)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.RANGE)).toBeNull()
      expect(sessionStorage.getItem(STORAGE_KEYS.GAME_RESULT)).toBeNull()
    })
  })
})
