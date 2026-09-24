import { MAX_TIME, MIN_LEVEL } from "@flashcards/shared"
import fc from "fast-check"
import { beforeEach, describe, expect, it } from "vitest"

import { STORAGE_KEYS } from "../constants"
import type { Card } from "../types"
import {
  createDefaultCard,
  getVirtualCards,
  initializeCards,
  loadCards,
  parseCardQuestion,
  removeLegacyDivisorCards,
  saveCards,
} from "./storage"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_CARD: Card = { question: "18:3", answer: 6, level: 1, time: 60 }

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe("div storage — property-based tests", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // Feature: div-app, Property 1: Card generation round-trip
  // **Validates: Requirements 1.2, 14.3**
  describe("Property 1: Card generation round-trip", () => {
    it("for any triple (X, Y, Z), both generated cards have correct answers and dividend / divisor === answer", () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 9 }), fc.integer({ min: 2, max: 9 }), (a, b) => {
          // Ensure X < Y
          const x = Math.min(a, b)
          const y = Math.max(a, b)
          if (x === y) return true // skip equal pairs

          const z = x * y

          const card1 = createDefaultCard(z, x, y)
          const card2 = createDefaultCard(z, y, x)

          // Card 1: "Z:X" → Y
          expect(card1.question).toBe(`${z}:${x}`)
          expect(card1.answer).toBe(y)

          // Card 2: "Z:Y" → X
          expect(card2.question).toBe(`${z}:${y}`)
          expect(card2.answer).toBe(x)

          // Round-trip: dividend / divisor === answer
          const parsed1 = parseCardQuestion(card1.question)
          expect(parsed1.dividend / parsed1.divisor).toBe(card1.answer)

          const parsed2 = parseCardQuestion(card2.question)
          expect(parsed2.dividend / parsed2.divisor).toBe(card2.answer)
        }),
        { numRuns: 100 },
      )
    })
  })

  // Feature: div-app, Property 2: Generated cards have unique questions and correct defaults
  // **Validates: Requirements 1.3, 1.4, 1.5**
  describe("Property 2: Generated cards have unique questions and correct defaults", () => {
    it("all 64 questions are unique, all have level === MIN_LEVEL and time === MAX_TIME", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const cards = initializeCards()

          // 28 non-square triples × 2 + 8 square triples × 1 = 64 cards
          expect(cards).toHaveLength(64)

          // All questions are unique
          const questions = cards.map((c) => c.question)
          const uniqueQuestions = new Set(questions)
          expect(uniqueQuestions.size).toBe(64)

          // All cards have correct defaults
          for (const card of cards) {
            expect(card.level).toBe(MIN_LEVEL)
            expect(card.time).toBe(MAX_TIME)
          }
        }),
        { numRuns: 100 },
      )
    })
  })
})

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe("div storage — unit tests", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── parseCardQuestion ──────────────────────────────────────────────────

  describe("parseCardQuestion", () => {
    it("parses standard question format", () => {
      expect(parseCardQuestion("18:3")).toEqual({ dividend: 18, divisor: 3 })
    })

    it("parses larger numbers", () => {
      expect(parseCardQuestion("72:9")).toEqual({ dividend: 72, divisor: 9 })
    })

    it("returns zeros for invalid input without colon", () => {
      expect(parseCardQuestion("abc")).toEqual({ dividend: 0, divisor: 0 })
    })

    it("returns zeros for empty string", () => {
      expect(parseCardQuestion("")).toEqual({ dividend: 0, divisor: 0 })
    })

    it("returns zero for non-numeric parts", () => {
      expect(parseCardQuestion("abc:def")).toEqual({ dividend: 0, divisor: 0 })
    })

    it("handles single number before colon", () => {
      expect(parseCardQuestion("5:")).toEqual({ dividend: 5, divisor: 0 })
    })
  })

  // ─── createDefaultCard ──────────────────────────────────────────────────

  describe("createDefaultCard", () => {
    it("creates card with correct question format", () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.question).toBe("18:3")
    })

    it("stores the provided answer", () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.answer).toBe(6)
    })

    it("sets default level and time", () => {
      const card = createDefaultCard(18, 3, 6)
      expect(card.level).toBe(MIN_LEVEL)
      expect(card.time).toBe(MAX_TIME)
    })
  })

  // ─── initializeCards ────────────────────────────────────────────────────

  describe("initializeCards", () => {
    it("generates exactly 64 cards", () => {
      const cards = initializeCards()
      expect(cards).toHaveLength(64)
    })

    it("generates cards from 36 triples (X ≤ Y)", () => {
      const cards = initializeCards()
      // 28 non-square triples × 2 + 8 square triples × 1 = 64
      const questions = new Set(cards.map((c) => c.question))
      expect(questions.size).toBe(64)
    })

    it("all cards have MIN_LEVEL and MAX_TIME", () => {
      const cards = initializeCards()
      for (const card of cards) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it("saves cards to localStorage", () => {
      initializeCards()
      expect(localStorage.getItem(STORAGE_KEYS.CARDS)).not.toBeNull()
    })

    it("contains expected card pair for triple (2,3,6)", () => {
      const cards = initializeCards()
      const q1 = cards.find((c) => c.question === "6:2")
      const q2 = cards.find((c) => c.question === "6:3")
      expect(q1).toBeDefined()
      expect(q1?.answer).toBe(3)
      expect(q2).toBeDefined()
      expect(q2?.answer).toBe(2)
    })

    it("contains expected card pair for triple (8,9,72)", () => {
      const cards = initializeCards()
      const q1 = cards.find((c) => c.question === "72:8")
      const q2 = cards.find((c) => c.question === "72:9")
      expect(q1).toBeDefined()
      expect(q1?.answer).toBe(9)
      expect(q2).toBeDefined()
      expect(q2?.answer).toBe(8)
    })

    it("contains square cards (X²:X → X)", () => {
      const cards = initializeCards()
      const squareCards = [
        { question: "4:2", answer: 2 },
        { question: "9:3", answer: 3 },
        { question: "16:4", answer: 4 },
        { question: "25:5", answer: 5 },
        { question: "36:6", answer: 6 },
        { question: "49:7", answer: 7 },
        { question: "64:8", answer: 8 },
        { question: "81:9", answer: 9 },
      ]
      for (const expected of squareCards) {
        const found = cards.find((c) => c.question === expected.question)
        expect(found).toBeDefined()
        expect(found?.answer).toBe(expected.answer)
      }
    })
  })

  // ─── removeLegacyDivisorCards ───────────────────────────────────────────

  describe("removeLegacyDivisorCards", () => {
    it("deletes stored cards with divisor 11 or 12 and keeps the rest", () => {
      saveCards([
        { question: "6:2", answer: 3, level: 5, time: 10 },
        { question: "22:11", answer: 2, level: 4, time: 7 },
        { question: "48:12", answer: 4, level: 3, time: 8 },
      ])
      removeLegacyDivisorCards()
      expect(loadCards().map((c) => c.question)).toEqual(["6:2"])
    })
  })

  // ─── getVirtualCards ────────────────────────────────────────────────────

  describe("getVirtualCards", () => {
    it("returns 64 cards with divisors 2-9 and answers 2-9", () => {
      const cards = getVirtualCards()
      expect(cards).toHaveLength(64)
      for (const card of cards) {
        const { divisor } = parseCardQuestion(card.question)
        expect(divisor).toBeGreaterThanOrEqual(2)
        expect(divisor).toBeLessThanOrEqual(9)
        expect(card.answer).toBeGreaterThanOrEqual(2)
        expect(card.answer).toBeLessThanOrEqual(9)
      }
    })

    it("uses stored card data when available", () => {
      const storedCard: Card = { question: "6:2", answer: 3, level: 5, time: 10 }
      saveCards([storedCard])
      const cards = getVirtualCards()
      expect(cards.find((c) => c.question === "6:2")?.level).toBe(5)
      expect(cards.find((c) => c.question === "6:2")?.time).toBe(10)
    })

    it("creates default cards for missing entries", () => {
      saveCards([])
      for (const card of getVirtualCards()) {
        expect(card.level).toBe(MIN_LEVEL)
        expect(card.time).toBe(MAX_TIME)
      }
    })

    it("has unique questions", () => {
      const questions = getVirtualCards().map((c) => c.question)
      expect(new Set(questions).size).toBe(questions.length)
    })
  })

  // ─── loadCards ──────────────────────────────────────────────────────────

  describe("loadCards", () => {
    it("returns empty array when localStorage is empty", () => {
      expect(loadCards()).toEqual([])
    })

    it("returns stored cards when present", () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([SAMPLE_CARD]))
      expect(loadCards()).toEqual([SAMPLE_CARD])
    })

    it("returns empty array for invalid JSON", () => {
      localStorage.setItem(STORAGE_KEYS.CARDS, "not-json")
      expect(loadCards()).toEqual([])
    })
  })
})
