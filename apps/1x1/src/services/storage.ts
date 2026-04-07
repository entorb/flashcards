/**
 * 1x1 Multiplication App - Storage Service
 * Uses shared factory for common operations, keeps app-specific logic here.
 */

import { createAppStorageFactory, MAX_TIME, MIN_LEVEL, saveJSON } from '@flashcards/shared'

import { DEFAULT_RANGE, STORAGE_KEYS } from '@/constants'
import type { Card, GameHistory, GameSettings } from '@/types'

// ============================================================================
// UTILITY FUNCTIONS (app-specific)
// ============================================================================

/**
 * Parse a card question string into x and y numbers
 * @param question - Card question in format "YxX" (e.g., "3x6")
 * @returns Object with x and y numbers
 */
export function parseCardQuestion(question: string): { x: number; y: number } {
  const [yStr, xStr] = question.split('x')
  const y = Number.parseInt(yStr ?? '', 10) || 0
  const x = Number.parseInt(xStr ?? '', 10) || 0
  return { x, y }
}

/**
 * Create a default card with initial level and time
 * @param y - First number (larger or equal to x)
 * @param x - Second number (smaller or equal to y)
 * @returns Card with default values
 */
export function createDefaultCard(y: number, x: number): Card {
  return {
    question: `${y}x${x}`,
    answer: x * y,
    level: MIN_LEVEL,
    time: MAX_TIME
  }
}

// ============================================================================
// SHARED FACTORY
// ============================================================================

const factory = createAppStorageFactory<Card, GameHistory, GameSettings>({
  storageKeys: STORAGE_KEYS,
  defaultRange: DEFAULT_RANGE,
  appLabel: '1x1',
  createCardFromQuestion: (question: string) => {
    const { x, y } = parseCardQuestion(question)
    return createDefaultCard(y, x)
  }
})

// ============================================================================
// APP-SPECIFIC CARD OPERATIONS
// ============================================================================

/**
 * Initialize all multiplication cards for the app
 * Generates cards from 3x3 to 9x9 where x <= y (avoiding duplicates)
 */
export function initializeCards(): Card[] {
  const cards: Card[] = []
  const minTable = Math.min(...DEFAULT_RANGE)
  const maxTable = Math.max(...DEFAULT_RANGE)

  for (let y = minTable; y <= maxTable; y++) {
    for (let x = minTable; x <= y; x++) {
      cards.push(createDefaultCard(y, x))
    }
  }

  saveJSON(STORAGE_KEYS.CARDS, cards)
  return cards
}

/**
 * Generate virtual cards for all possible combinations in range
 * Returns stored card if exists, otherwise creates virtual card with defaults
 */
export function getVirtualCardsForRange(range: number[]): Card[] {
  const storedCards = factory.loadCards()
  const cardMap = new Map(storedCards.map(c => [c.question, c]))
  const virtualCards: Card[] = []

  for (const y of range) {
    for (const x of range) {
      if (x <= y) {
        const question = `${y}x${x}`
        const existingCard = cardMap.get(question)

        if (existingCard) {
          virtualCards.push(existingCard)
        } else {
          // Create virtual card with default values
          virtualCards.push(createDefaultCard(y, x))
        }
      }
    }
  }

  return virtualCards
}

/**
 * Toggle a feature by updating the range array
 * Returns the new range
 */
export function toggleFeature(
  current: number[],
  feature: 'feature1x2' | 'feature1x12' | 'feature1x20'
): number[] {
  const currentSet = new Set(current)

  switch (feature) {
    case 'feature1x2': {
      // Toggle 2 in range
      if (currentSet.has(2)) {
        // Deactivate: remove 2
        return current.filter(n => n !== 2)
      }
      // Activate: add 2 at beginning
      return [2, ...current]
    }
    case 'feature1x12': {
      // Toggle 11, 12 in range
      if (currentSet.has(11) || currentSet.has(12)) {
        // Deactivate: remove 11, 12, and also remove 13-20 if present (1x20 depends on 1x12)
        return current.filter(n => n < 11)
      }
      // Activate: add 11, 12
      const base = current.filter(n => n < 11)
      return [...base, 11, 12]
    }
    case 'feature1x20': {
      // Toggle 13-20 in range (and auto-enable 1x12)
      if (currentSet.has(13)) {
        // Deactivate: remove 13-20
        return current.filter(n => n < 13)
      }
      // Activate: add 11-20 (auto-enables 1x12)
      const base = current.filter(n => n < 11)
      return [...base, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    }
  }
}

// ============================================================================
// RE-EXPORT SHARED FACTORY FUNCTIONS (preserves public API)
// ============================================================================

export const {
  loadCards,
  saveCards,
  updateCard,
  resetCards,
  loadHistory,
  saveHistory,
  addHistory,
  loadGameStats,
  saveGameStats,
  updateStatistics,
  setGameConfig,
  getGameConfig,
  setGameResult,
  getGameResult,
  clearGameResult,
  incrementDailyGames,
  saveGameState,
  loadGameState,
  clearGameState,
  loadRange,
  saveRange,
  loadSettings,
  saveSettings,
  resetAll
} = factory
