import { beforeEach, describe, expect, it } from 'vitest'

import { initializeCards } from '@/services/storage'
import type { Card, GameSettings } from '@/types'
import { filterCards, selectCardsForRound } from './cardSelector'

describe('pum cardSelector — unit tests', () => {
  let allCards: Card[]

  beforeEach(() => {
    localStorage.clear()
    allCards = initializeCards()
  })

  // ─── filterCards — by operation ─────────────────────────────────────────

  describe('filterCards — by operation', () => {
    it('filters by single operation (plus)', () => {
      const settings: GameSettings = {
        operations: ['plus'],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      for (const card of filtered) {
        expect(card.question).toContain('+')
      }
      expect(filtered).toHaveLength(210) // 55 + 100 + 55
    })

    it('filters by single operation (minus)', () => {
      const settings: GameSettings = {
        operations: ['minus'],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      for (const card of filtered) {
        expect(card.question).toContain('-')
      }
      expect(filtered).toHaveLength(210)
    })

    it('filters by multiple operations returns all cards', () => {
      const settings: GameSettings = {
        operations: ['plus', 'minus'],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(420)
    })
  })

  // ─── filterCards — by difficulty ────────────────────────────────────────

  describe('filterCards — by difficulty', () => {
    it('filters by single difficulty (simple)', () => {
      const settings: GameSettings = {
        operations: ['plus', 'minus'],
        difficulties: ['simple'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(110) // 55 plus + 55 minus
    })

    it('filters by single difficulty (medium)', () => {
      const settings: GameSettings = {
        operations: ['plus', 'minus'],
        difficulties: ['medium'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(200) // 100 plus + 100 minus
    })

    it('filters by single difficulty (advanced)', () => {
      const settings: GameSettings = {
        operations: ['plus', 'minus'],
        difficulties: ['advanced'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(110) // 55 plus + 55 minus
    })
  })

  // ─── filterCards — intersection ─────────────────────────────────────────

  describe('filterCards — intersection of operation + difficulty', () => {
    it('filters plus + simple', () => {
      const settings: GameSettings = {
        operations: ['plus'],
        difficulties: ['simple'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(55)
      for (const card of filtered) {
        expect(card.question).toContain('+')
      }
    })

    it('filters minus + medium', () => {
      const settings: GameSettings = {
        operations: ['minus'],
        difficulties: ['medium'],
        focus: 'weak'
      }
      const filtered = filterCards(allCards, settings)
      expect(filtered).toHaveLength(100)
      for (const card of filtered) {
        expect(card.question).toContain('-')
      }
    })
  })

  // ─── filterCards — empty selections ─────────────────────────────────────

  describe('filterCards — empty selections', () => {
    it('empty operations returns empty', () => {
      const settings: GameSettings = {
        operations: [],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      }
      expect(filterCards(allCards, settings)).toHaveLength(0)
    })

    it('empty difficulties returns empty', () => {
      const settings: GameSettings = {
        operations: ['plus', 'minus'],
        difficulties: [],
        focus: 'weak'
      }
      expect(filterCards(allCards, settings)).toHaveLength(0)
    })
  })

  // ─── selectCardsForRound ────────────────────────────────────────────────

  describe('selectCardsForRound', () => {
    it('returns correct count when count < cards.length', () => {
      const cards: Card[] = allCards.slice(0, 20)
      const selected = selectCardsForRound(cards, 'weak', 10)
      expect(selected).toHaveLength(10)
    })

    it('returns all cards when count >= cards.length', () => {
      const cards: Card[] = allCards.slice(0, 5)
      const selected = selectCardsForRound(cards, 'weak', 10)
      expect(selected).toHaveLength(5)
    })

    it('does not mutate the input cards array', () => {
      const cards: Card[] = allCards.slice(0, 20)
      const originalLength = cards.length
      selectCardsForRound(cards, 'weak', 10)
      expect(cards).toHaveLength(originalLength)
    })
  })
})
