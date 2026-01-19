/**
 * Test utilities for LWK app
 */

import type { Card, CardDeck } from '../types'

/**
 * Create a test card with optional overrides
 */
export function createTestCard(overrides: Partial<Card> = {}): Card {
  return {
    word: 'Test',
    level: 1,
    time: 60,
    ...overrides
  }
}

/**
 * Create a test deck with optional overrides
 */
export function createTestDeck(overrides: Partial<CardDeck> = {}): CardDeck {
  return {
    name: 'test',
    cards: [createTestCard()],
    ...overrides
  }
}

/**
 * Clear all storage (localStorage and sessionStorage)
 */
export function clearAllStorage(): void {
  localStorage.clear()
  sessionStorage.clear()
}
