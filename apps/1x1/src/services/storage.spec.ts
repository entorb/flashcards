import { beforeEach, describe, expect, it } from 'vitest'

import { initializeCards } from '@/services/storage'

describe('Card Initialization', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize exactly 28 cards for 3x3 to 9x9', () => {
    const cards = initializeCards()
    expect(cards).toHaveLength(28)
  })

  it('should have all expected cards', () => {
    const cards = initializeCards()
    const questions = cards.map(c => c.question)
    questions.sort((a, b) => a.localeCompare(b))

    // Generate expected questions (x <= y format)
    const expected: string[] = []
    for (let y = 3; y <= 9; y++) {
      for (let x = 3; x <= y; x++) {
        expected.push(`${y}x${x}`)
      }
    }

    expect(questions).toEqual(expected.sort((a, b) => a.localeCompare(b)))
  })

  it('should initialize all cards with level 1 and time 60', () => {
    const cards = initializeCards()

    for (const card of cards) {
      expect(card.level).toBe(1)
      expect(card.time).toBe(60)
    }
  })
})
