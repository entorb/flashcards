/**
 * LWK App - Helper Utilities
 */

import { levenshteinDistance, MAX_LEVEL, MAX_TIME, MIN_LEVEL } from '@flashcards/shared'

import type { Card } from '../types'

import { LEVENSHTEIN_THRESHOLD } from '@/constants'

/**
 * Check if user's spelling is correct or close match
 * Case-sensitive comparison
 * Returns 'correct', 'close', or 'incorrect'
 */
export function validateTypingAnswer(
  userInput: string,
  correctWord: string
): 'correct' | 'close' | 'incorrect' {
  const normalized = userInput.trim()
  const correct = correctWord.trim()

  if (normalized === correct) {
    return 'correct'
  }

  // Close match: Levenshtein distance (one insertion, deletion, or substitution)
  if (levenshteinDistance(normalized, correct) <= LEVENSHTEIN_THRESHOLD) {
    return 'close'
  }

  return 'incorrect'
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
