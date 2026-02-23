import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fc from 'fast-check'

import { MAX_TIME, MIN_LEVEL } from '../constants'
import { createBaseGameStore } from './useBaseGameStore'
import type { BaseCard, BaseGameHistory, GameStats } from '../types'
import type { PointsBreakdown } from '../services/scoring'

// ─── Mock helpers ────────────────────────────────────────────────────────────

function makeCard(level = 1, time = 60): BaseCard {
  return { level, time }
}

function makeHistory(points = 10): BaseGameHistory {
  return { date: '2024-01-01', points, correctAnswers: 1 }
}

function makeStats(overrides: Partial<GameStats> = {}): GameStats {
  return { gamesPlayed: 0, points: 0, correctAnswers: 0, ...overrides }
}

function makeBreakdown(totalPoints = 5): PointsBreakdown {
  return {
    levelPoints: 5,
    difficultyPoints: 0,
    pointsBeforeBonus: 5,
    closeAdjustment: 0,
    languageBonus: 0,
    timeBonus: 0,
    totalPoints
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function makeStore(
  cards: BaseCard[] = [makeCard()],
  history: BaseGameHistory[] = [],
  stats: GameStats = makeStats()
) {
  const loadCards = vi.fn(() => [...cards])
  const loadHistory = vi.fn(() => [...history])
  const loadGameStats = vi.fn(() => ({ ...stats }))
  const saveHistory = vi.fn()
  const saveGameStats = vi.fn()
  const saveCards = vi.fn()

  const store = createBaseGameStore<BaseCard, BaseGameHistory, Record<string, unknown>>({
    loadCards,
    loadHistory,
    loadGameStats,
    saveHistory,
    saveGameStats,
    saveCards
  })

  return { store, loadCards, loadHistory, loadGameStats, saveHistory, saveGameStats, saveCards }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useBaseGameStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── initializeStore ────────────────────────────────────────────────────────

  describe('initializeStore', () => {
    it('calls loadCards, loadHistory, loadGameStats on first call', () => {
      const { store, loadCards, loadHistory, loadGameStats } = makeStore()
      store.initializeStore()
      expect(loadCards).toHaveBeenCalledOnce()
      expect(loadHistory).toHaveBeenCalledOnce()
      expect(loadGameStats).toHaveBeenCalledOnce()
    })

    it('populates allCards from loadCards result', () => {
      const cards = [makeCard(1), makeCard(2), makeCard(3)]
      const { store } = makeStore(cards)
      store.initializeStore()
      expect(store.allCards.value).toHaveLength(3)
    })

    it('populates history from loadHistory result', () => {
      const history = [makeHistory(10), makeHistory(20)]
      const { store } = makeStore(undefined, history)
      store.initializeStore()
      expect(store.history.value).toHaveLength(2)
    })

    it('populates gameStats from loadGameStats result', () => {
      const stats = makeStats({ gamesPlayed: 7, points: 42, correctAnswers: 15 })
      const { store } = makeStore(undefined, undefined, stats)
      store.initializeStore()
      expect(store.gameStats.value.gamesPlayed).toBe(7)
      expect(store.gameStats.value.points).toBe(42)
    })

    it('is idempotent — storage loaded only once when called twice', () => {
      const { store, loadCards, loadHistory, loadGameStats } = makeStore()
      store.initializeStore()
      store.initializeStore()
      expect(loadCards).toHaveBeenCalledOnce()
      expect(loadHistory).toHaveBeenCalledOnce()
      expect(loadGameStats).toHaveBeenCalledOnce()
    })
  })

  // ── nextCard ───────────────────────────────────────────────────────────────

  describe('nextCard', () => {
    it('increments currentCardIndex', () => {
      const { store } = makeStore()
      store.gameCards.value = [makeCard(), makeCard(), makeCard()]
      expect(store.currentCardIndex.value).toBe(0)
      store.nextCard()
      expect(store.currentCardIndex.value).toBe(1)
    })

    it('returns false when still within bounds', () => {
      const { store } = makeStore()
      store.gameCards.value = [makeCard(), makeCard(), makeCard()]
      const result = store.nextCard()
      expect(result).toBe(false)
    })

    it('returns true when index reaches last card', () => {
      const { store } = makeStore()
      store.gameCards.value = [makeCard()]
      // currentCardIndex starts at 0; after nextCard it becomes 1 >= length 1
      const result = store.nextCard()
      expect(result).toBe(true)
    })

    it('returns true when index goes past last card', () => {
      const { store } = makeStore()
      store.gameCards.value = [makeCard(), makeCard()]
      store.nextCard() // index → 1 (still in bounds)
      const result = store.nextCard() // index → 2 >= 2
      expect(result).toBe(true)
    })
  })

  // ── saveGameResults ────────────────────────────────────────────────────────

  describe('saveGameResults', () => {
    it('appends entry to history', () => {
      const { store } = makeStore(undefined, [makeHistory(5)])
      store.initializeStore()
      store.saveGameResults(makeHistory(10))
      expect(store.history.value).toHaveLength(2)
      expect(store.history.value[1]!.points).toBe(10)
    })

    it('increments gameStats.gamesPlayed', () => {
      const { store } = makeStore(undefined, undefined, makeStats({ gamesPlayed: 3 }))
      store.initializeStore()
      store.saveGameResults(makeHistory())
      expect(store.gameStats.value.gamesPlayed).toBe(4)
    })

    it('adds current points to gameStats.points', () => {
      const { store } = makeStore(undefined, undefined, makeStats({ points: 10 }))
      store.initializeStore()
      store.points.value = 7
      store.saveGameResults(makeHistory())
      expect(store.gameStats.value.points).toBe(17)
    })

    it('adds correctAnswersCount to gameStats.correctAnswers', () => {
      const { store } = makeStore(undefined, undefined, makeStats({ correctAnswers: 5 }))
      store.initializeStore()
      store.correctAnswersCount.value = 3
      store.saveGameResults(makeHistory())
      expect(store.gameStats.value.correctAnswers).toBe(8)
    })
  })

  // ── discardGame ────────────────────────────────────────────────────────────

  describe('discardGame', () => {
    it('resets gameCards to empty array', () => {
      const { store } = makeStore()
      store.gameCards.value = [makeCard(), makeCard()]
      store.discardGame()
      expect(store.gameCards.value).toHaveLength(0)
    })

    it('resets currentCardIndex to 0', () => {
      const { store } = makeStore()
      store.currentCardIndex.value = 3
      store.discardGame()
      expect(store.currentCardIndex.value).toBe(0)
    })

    it('resets points to 0', () => {
      const { store } = makeStore()
      store.points.value = 42
      store.discardGame()
      expect(store.points.value).toBe(0)
    })

    it('resets correctAnswersCount to 0', () => {
      const { store } = makeStore()
      store.correctAnswersCount.value = 5
      store.discardGame()
      expect(store.correctAnswersCount.value).toBe(0)
    })

    it('resets gameSettings to null', () => {
      const { store } = makeStore()
      store.gameSettings.value = { mode: 'copy' }
      store.discardGame()
      expect(store.gameSettings.value).toBeNull()
    })
  })

  // ── moveAllCards ───────────────────────────────────────────────────────────

  describe('moveAllCards', () => {
    it('sets all card levels to the given level', () => {
      const cards = [makeCard(1), makeCard(2), makeCard(3)]
      const { store } = makeStore(cards)
      store.initializeStore()
      store.moveAllCards(3)
      for (const card of store.allCards.value) {
        expect(card.level).toBe(3)
      }
    })

    it('calls saveCards after updating levels', () => {
      const { store, saveCards } = makeStore([makeCard(1), makeCard(2)])
      store.initializeStore()
      store.moveAllCards(3)
      expect(saveCards).toHaveBeenCalledOnce()
      expect(saveCards).toHaveBeenCalledWith(store.allCards.value)
    })

    it('does nothing when level is below MIN_LEVEL', () => {
      const cards = [makeCard(2)]
      const { store, saveCards } = makeStore(cards)
      store.initializeStore()
      store.moveAllCards(0)
      expect(store.allCards.value[0]!.level).toBe(2)
      expect(saveCards).not.toHaveBeenCalled()
    })

    it('does nothing when level is above MAX_LEVEL', () => {
      const cards = [makeCard(2)]
      const { store, saveCards } = makeStore(cards)
      store.initializeStore()
      store.moveAllCards(6)
      expect(store.allCards.value[0]!.level).toBe(2)
      expect(saveCards).not.toHaveBeenCalled()
    })
  })

  // ── resetAllCards ──────────────────────────────────────────────────────────

  describe('resetAllCards', () => {
    it('sets all card levels to MIN_LEVEL', () => {
      const cards = [makeCard(3), makeCard(5)]
      const { store } = makeStore(cards)
      store.initializeStore()
      store.resetAllCards()
      for (const card of store.allCards.value) {
        expect(card.level).toBe(MIN_LEVEL)
      }
    })

    it('sets all card times to MAX_TIME', () => {
      const cards = [makeCard(3, 10), makeCard(5, 20)]
      const { store } = makeStore(cards)
      store.initializeStore()
      store.resetAllCards()
      for (const card of store.allCards.value) {
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it('calls saveCards after resetting', () => {
      const { store, saveCards } = makeStore([makeCard(3)])
      store.initializeStore()
      store.resetAllCards()
      expect(saveCards).toHaveBeenCalledOnce()
    })
  })

  // ── handleAnswerBase ───────────────────────────────────────────────────────

  describe('handleAnswerBase', () => {
    it('increments correctAnswersCount when result is correct', () => {
      const { store } = makeStore()
      expect(store.correctAnswersCount.value).toBe(0)
      store.handleAnswerBase('correct', makeBreakdown(5))
      expect(store.correctAnswersCount.value).toBe(1)
    })

    it('does not increment correctAnswersCount when result is incorrect', () => {
      const { store } = makeStore()
      store.handleAnswerBase('incorrect', makeBreakdown(0))
      expect(store.correctAnswersCount.value).toBe(0)
    })

    it('does not increment correctAnswersCount when result is close', () => {
      const { store } = makeStore()
      store.handleAnswerBase('close', makeBreakdown(3))
      expect(store.correctAnswersCount.value).toBe(0)
    })

    it('adds pointsBreakdown.totalPoints to points', () => {
      const { store } = makeStore()
      store.handleAnswerBase('correct', makeBreakdown(7))
      expect(store.points.value).toBe(7)
    })

    it('accumulates points across multiple calls', () => {
      const { store } = makeStore()
      store.handleAnswerBase('correct', makeBreakdown(5))
      store.handleAnswerBase('correct', makeBreakdown(3))
      expect(store.points.value).toBe(8)
    })

    it('stores the last points breakdown', () => {
      const { store } = makeStore()
      const breakdown = makeBreakdown(9)
      store.handleAnswerBase('correct', breakdown)
      expect(store.lastPointsBreakdown.value).toEqual(breakdown)
    })

    it('adds 0 points for incorrect answer with 0 totalPoints', () => {
      const { store } = makeStore()
      store.handleAnswerBase('incorrect', makeBreakdown(0))
      expect(store.points.value).toBe(0)
    })
  })

  // ── Property-based: correctAnswersCount invariant ─────────────────────────

  /**
   * Validates: Requirements 7.4
   * Invariant: correctAnswersCount is always <= total game cards count
   * after answering each card exactly once (matching real game flow).
   */
  describe('handleAnswerBase — correctAnswers invariant property tests', () => {
    it('correctAnswersCount is always <= gameCards.length after answering each card once', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              level: fc.integer({ min: 1, max: 5 }),
              time: fc.integer({ min: 1, max: 60 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          cards => {
            const { store } = makeStore(cards)
            store.initializeStore()
            store.gameCards.value = [...store.allCards.value]
            const totalCards = store.gameCards.value.length

            // Answer each card exactly once (real game flow: one answer per card)
            for (let i = 0; i < totalCards; i++) {
              const result = i % 3 === 0 ? 'correct' : i % 3 === 1 ? 'incorrect' : 'close'
              store.handleAnswerBase(result, makeBreakdown(result === 'correct' ? 5 : 0))
            }

            return store.correctAnswersCount.value <= totalCards
          }
        )
      )
    })
  })

  // ── Property-based: moveAllCards idempotence ───────────────────────────────

  /**
   * Validates: Requirements 7.6
   * Idempotence property: calling moveAllCards twice with the same level
   * produces the same result as calling it once.
   */
  describe('moveAllCards — property tests', () => {
    it('is idempotent: calling twice with same level equals calling once', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              level: fc.integer({ min: 1, max: 5 }),
              time: fc.integer({ min: 1, max: 60 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 1, max: 5 }),
          (cards, targetLevel) => {
            // First store: call moveAllCards once
            const { store: store1 } = makeStore(cards)
            store1.initializeStore()
            store1.moveAllCards(targetLevel)
            const afterOnce = store1.allCards.value.map(c => ({ ...c }))

            // Second store: call moveAllCards twice with same level
            const { store: store2 } = makeStore(cards)
            store2.initializeStore()
            store2.moveAllCards(targetLevel)
            store2.moveAllCards(targetLevel)
            const afterTwice = store2.allCards.value.map(c => ({ ...c }))

            return JSON.stringify(afterOnce) === JSON.stringify(afterTwice)
          }
        )
      )
    })
  })

  // ── Property-based: currentCardIndex invariant ────────────────────────────

  /**
   * Validates: Requirements 7.7
   * Invariant: currentCardIndex is always >= 0 and < gameCards.length
   * while the game is active (before nextCard returns true).
   */
  describe('nextCard — currentCardIndex invariant property tests', () => {
    it('currentCardIndex stays >= 0 and < gameCards.length while game is active', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              level: fc.integer({ min: 1, max: 5 }),
              time: fc.integer({ min: 1, max: 60 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          cards => {
            const { store } = makeStore(cards)
            store.initializeStore()
            store.gameCards.value = [...store.allCards.value]
            const total = store.gameCards.value.length

            // Walk through all cards; check invariant before each nextCard call
            for (let i = 0; i < total; i++) {
              const idx = store.currentCardIndex.value
              // Invariant: index is in bounds while game is active
              if (idx < 0 || idx >= total) return false
              store.nextCard()
            }
            // After exhausting all cards the index equals total (game over) — that's valid
            return store.currentCardIndex.value === total
          }
        )
      )
    })
  })
})
