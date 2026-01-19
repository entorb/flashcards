/**
 * LWK App - Helper Utilities
 */

import { levenshteinDistance } from '@flashcards/shared'

import { CLOSE_MATCH_SCORE_PERCENTAGE } from '../constants'
import type { SpellingCheck } from '../types'

/**
 * Normalize a string for comparison (trim whitespace)
 * Note: Case-sensitive for spelling practice
 */
export function normalizeString(str: string): string {
  return str.trim()
}

/**
 * Check if user's spelling is correct or close match
 * Case-sensitive comparison
 */
export function checkSpelling(userInput: string, correctWord: string): SpellingCheck {
  const normalized = normalizeString(userInput)
  const correct = normalizeString(correctWord)

  if (normalized === correct) {
    return { isCorrect: true, isCloseMatch: false, distance: 0 }
  }

  const distance = levenshteinDistance(normalized, correct)

  // Close match: Levenshtein distance 1 (one insertion, deletion, or substitution)
  if (distance === 1) {
    return { isCorrect: false, isCloseMatch: true, distance: 1 }
  }

  return { isCorrect: false, isCloseMatch: false, distance }
}

/**
 * Calculate points for a spelling answer
 * @param isCorrect - Whether answer was correct
 * @param isCloseMatch - Whether answer was close (1 char off)
 * @param cardLevel - Current card level (1-5)
 * @returns Points earned
 */
export function calculateSpellingPoints(
  isCorrect: boolean,
  isCloseMatch: boolean,
  cardLevel: number
): number {
  if (!isCorrect && !isCloseMatch) {
    return 0
  }

  // Base points from level (6 - level)
  const basePoints = 6 - cardLevel

  if (isCorrect) {
    return basePoints
  }

  // Close match: 75% of points
  return Math.round(basePoints * CLOSE_MATCH_SCORE_PERCENTAGE)
}
