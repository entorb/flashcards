/**
 * LWK App - Helper Utilities
 */

import {
  levenshteinDistance,
  MAX_TIME,
  MIN_LEVEL,
  parseLevel,
  sanitizeBaseCard,
  type AnswerStatus
} from '@flashcards/shared'

import { LEVENSHTEIN_THRESHOLD } from '@/constants'

import type { Card } from '../types'

/**
 * Check if user's spelling is correct or close match
 * Case-sensitive comparison
 * Returns 'correct', 'close', or 'incorrect'
 */
export function validateTypingAnswer(userInput: string, correctWord: string): AnswerStatus {
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
 * or newline-only separated words (no delimiter)
 * Extracts pure parsing logic for card imports
 *
 * Returns an object with cards array and detected delimiter, or null if invalid
 */
export function parseCardsFromText(text: string): { cards: Card[]; delimiter: string } | null {
  if (!text) {
    return null
  }

  const lines = text.trim().split('\n')
  const firstLine = lines[0] ?? ''
  const delimiter = detectDelimiter(firstLine)

  // If no delimiter found, treat as newline-only separated words
  if (delimiter === null) {
    return parseNewlineOnlyCards(lines)
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
 * Parse cards from newline-only separated words (no delimiter)
 */
function parseNewlineOnlyCards(lines: string[]): { cards: Card[]; delimiter: string } | null {
  const newCards: Card[] = []

  for (const line of lines) {
    const word = line.trim()
    if (word.length > 0 && !isHeaderLine(line, 0)) {
      newCards.push(
        sanitizeBaseCard({
          word,
          level: MIN_LEVEL,
          time: MAX_TIME
        })
      )
    }
  }

  return newCards.length > 0 ? { cards: newCards, delimiter: '\n' } : null
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
  const word = parts[0]?.trim()
  if (word === undefined || word === '') {
    return null
  }

  const level = parseLevel(parts[1])
  return sanitizeBaseCard({ word, level, time: MAX_TIME })
}
