import { MAX_TIME, MIN_LEVEL } from '@flashcards/shared'
import { beforeEach, describe, expect, it } from 'vitest'

import { STORAGE_KEYS } from '../constants'
import type { Card } from '../types'
import {
  createDefaultCard,
  getDifficultyForCard,
  getDifficultyFromQuestion,
  getOperationFromQuestion,
  initializeCards,
  loadCards,
  parseCardQuestion
} from './storage'

describe('pum storage — unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── parseCardQuestion ──────────────────────────────────────────────────

  describe('parseCardQuestion', () => {
    it('parses plus question format', () => {
      expect(parseCardQuestion('7+3')).toEqual({ x: 7, operator: '+', y: 3 })
    })

    it('parses minus question format', () => {
      expect(parseCardQuestion('15-8')).toEqual({ x: 15, operator: '-', y: 8 })
    })

    it('returns zeros for invalid input without operator', () => {
      expect(parseCardQuestion('abc')).toEqual({ x: 0, operator: '+', y: 0 })
    })

    it('returns zeros for empty string', () => {
      expect(parseCardQuestion('')).toEqual({ x: 0, operator: '+', y: 0 })
    })

    it('parses double-digit operands', () => {
      expect(parseCardQuestion('20+11')).toEqual({ x: 20, operator: '+', y: 11 })
      expect(parseCardQuestion('18-12')).toEqual({ x: 18, operator: '-', y: 12 })
    })
  })

  // ─── createDefaultCard ──────────────────────────────────────────────────

  describe('createDefaultCard', () => {
    it('creates plus card with correct question format', () => {
      const card = createDefaultCard(7, '+', 3)
      expect(card.question).toBe('7+3')
    })

    it('creates minus card with correct question format', () => {
      const card = createDefaultCard(15, '-', 8)
      expect(card.question).toBe('15-8')
    })

    it('computes correct answer for plus', () => {
      const card = createDefaultCard(7, '+', 3)
      expect(card.answer).toBe(10)
    })

    it('computes correct answer for minus', () => {
      const card = createDefaultCard(15, '-', 8)
      expect(card.answer).toBe(7)
    })

    it('sets default level and time', () => {
      const card = createDefaultCard(7, '+', 3)
      expect(card.level).toBe(MIN_LEVEL)
      expect(card.time).toBe(MAX_TIME)
    })
  })

  // ─── initializeCards ────────────────────────────────────────────────────

  describe('initializeCards', () => {
    it('generates exactly 420 cards', () => {
      const cards = initializeCards()
      expect(cards).toHaveLength(420)
    })

    it('generates 55 simple plus cards', () => {
      const cards = initializeCards()
      const simplePlus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('+') && x <= 10 && y <= 10
      })
      expect(simplePlus).toHaveLength(55)
    })

    it('generates 100 medium plus cards', () => {
      const cards = initializeCards()
      const mediumPlus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('+') && x >= 11 && y <= 10
      })
      expect(mediumPlus).toHaveLength(100)
    })

    it('generates 55 advanced plus cards', () => {
      const cards = initializeCards()
      const advancedPlus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('+') && x >= 11 && y >= 11
      })
      expect(advancedPlus).toHaveLength(55)
    })

    it('generates 55 simple minus cards', () => {
      const cards = initializeCards()
      const simpleMinus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('-') && x <= 10 && y <= 10
      })
      expect(simpleMinus).toHaveLength(55)
    })

    it('generates 100 medium minus cards', () => {
      const cards = initializeCards()
      const mediumMinus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('-') && x >= 11 && y <= 10
      })
      expect(mediumMinus).toHaveLength(100)
    })

    it('generates 55 advanced minus cards', () => {
      const cards = initializeCards()
      const advancedMinus = cards.filter(c => {
        const { x, y } = parseCardQuestion(c.question)
        return c.question.includes('-') && x >= 11 && y >= 11
      })
      expect(advancedMinus).toHaveLength(55)
    })

    it('all questions are unique', () => {
      const cards = initializeCards()
      const questions = new Set(cards.map(c => c.question))
      expect(questions.size).toBe(420)
    })

    it('all cards have MIN_LEVEL and MAX_TIME', () => {
      const cards = initializeCards()
      for (const card of cards) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it('saves cards to localStorage', () => {
      initializeCards()
      expect(localStorage.getItem(STORAGE_KEYS.CARDS)).not.toBeNull()
    })
  })

  // ─── getDifficultyForCard ───────────────────────────────────────────────

  describe('getDifficultyForCard', () => {
    it('returns Y as base difficulty for plus cards', () => {
      const card: Card = { question: '7+3', answer: 10, level: 1, time: 60 }
      expect(getDifficultyForCard(card)).toBe(3)
    })

    it('returns Y + 2 for minus cards', () => {
      const card: Card = { question: '15-8', answer: 7, level: 1, time: 60 }
      expect(getDifficultyForCard(card)).toBe(10) // 8 + 2
    })

    it('adds 0 bonus for plus', () => {
      const card: Card = { question: '10+5', answer: 15, level: 1, time: 60 }
      expect(getDifficultyForCard(card)).toBe(5)
    })
  })

  // ─── getOperationFromQuestion ───────────────────────────────────────────

  describe('getOperationFromQuestion', () => {
    it('returns plus for + operator', () => {
      expect(getOperationFromQuestion('7+3')).toBe('plus')
    })

    it('returns minus for - operator', () => {
      expect(getOperationFromQuestion('15-8')).toBe('minus')
    })
  })

  // ─── getDifficultyFromQuestion ──────────────────────────────────────────

  describe('getDifficultyFromQuestion', () => {
    it('returns simple when both operands <= 10', () => {
      expect(getDifficultyFromQuestion('7+3')).toBe('simple')
      expect(getDifficultyFromQuestion('10-5')).toBe('simple')
    })

    it('returns medium when X >= 11 and Y <= 10', () => {
      expect(getDifficultyFromQuestion('15+3')).toBe('medium')
      expect(getDifficultyFromQuestion('20-8')).toBe('medium')
    })

    it('returns advanced when both operands >= 11', () => {
      expect(getDifficultyFromQuestion('15+12')).toBe('advanced')
      expect(getDifficultyFromQuestion('20-11')).toBe('advanced')
    })
  })

  // ─── round-trip ─────────────────────────────────────────────────────────

  describe('round-trip: parse → reconstruct → matches original', () => {
    it('round-trips a plus question', () => {
      const original = '7+3'
      const { x, operator, y } = parseCardQuestion(original)
      expect(`${x}${operator}${y}`).toBe(original)
    })

    it('round-trips a minus question', () => {
      const original = '15-8'
      const { x, operator, y } = parseCardQuestion(original)
      expect(`${x}${operator}${y}`).toBe(original)
    })

    it('round-trips all generated cards', () => {
      const cards = initializeCards()
      for (const card of cards) {
        const { x, operator, y } = parseCardQuestion(card.question)
        expect(`${x}${operator}${y}`).toBe(card.question)
      }
    })
  })

  // ─── loadCards ──────────────────────────────────────────────────────────

  describe('loadCards', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadCards()).toEqual([])
    })

    it('returns stored cards when present', () => {
      const sampleCard: Card = { question: '7+3', answer: 10, level: 1, time: 60 }
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([sampleCard]))
      expect(loadCards()).toEqual([sampleCard])
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, 'not-json')
      expect(loadCards()).toEqual([])
    })
  })
})
