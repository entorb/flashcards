/**
 * LWK App - Helper Utilities
 */

import { levenshteinDistance, MAX_LEVEL, MAX_TIME, MIN_LEVEL } from '@flashcards/shared'

import { CLOSE_MATCH_SCORE_PERCENTAGE, LEVENSHTEIN_THRESHOLD } from '../constants'
import type { Card, SpellingCheck } from '../types'

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

  // Close match: Levenshtein distance (one insertion, deletion, or substitution)
  if (distance <= LEVENSHTEIN_THRESHOLD) {
    return { isCorrect: false, isCloseMatch: true, distance }
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

/**
 * Parses text input with various delimiters (tab, semicolon, comma, slash)
 * Extracts pure parsing logic for card imports
 *
 * Returns an object with cards array and detected delimiter, or null if invalid
 */
export function parseCardsFromText(text: string): { cards: Card[]; delimiter: string } | null {
  if (!text) {
    return null
  }

  const lines = text.trim().split('\n')
  const firstLine = lines[0]
  const delimiter = detectDelimiter(firstLine)
  if (!delimiter) {
    return null // No valid delimiter found
  }

  const newCards: Card[] = []
  for (const [index, line] of lines.entries()) {
    if (isHeaderLine(line, index)) {
      continue // Skip header
    }

    const card = parseCardFromLine(line, delimiter)
    if (card) {
      newCards.push(card)
    }
  }

  return newCards.length > 0 ? { cards: newCards, delimiter } : null
}

/**
 * Detect delimiter from the first line
 */
function detectDelimiter(firstLine: string): string | null {
  if (firstLine.includes('\t')) return '\t'
  if (firstLine.includes(';')) return ';'
  if (firstLine.includes(',')) return ','
  if (firstLine.includes('/')) return '/'
  return null
}

/**
 * Check if line is a header line
 */
function isHeaderLine(line: string, index: number): boolean {
  return index === 0 && line.toLowerCase().includes('word') && line.toLowerCase().includes('level')
}

/**
 * Parse a single card from a line
 */
function parseCardFromLine(line: string, delimiter: string): Card | null {
  const parts = line.split(delimiter)
  if (parts.length < 1 || !parts[0].trim()) {
    return null
  }

  const word = parts[0].trim()
  const level = parseLevel(parts[1])
  return { word, level, time: MAX_TIME }
}

/**
 * Parse level from string, default to MIN_LEVEL if invalid
 */
function parseLevel(levelStr?: string): number {
  if (!levelStr) return MIN_LEVEL
  const parsed = Number.parseInt(levelStr, 10)
  if (Number.isNaN(parsed) || parsed < MIN_LEVEL || parsed > MAX_LEVEL) {
    return MIN_LEVEL
  }
  return parsed
}
