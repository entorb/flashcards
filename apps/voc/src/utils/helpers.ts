import {
  type AnswerStatus,
  levenshteinDistance,
  MAX_TIME,
  normalizeWhitespace,
  parseLevel,
  sanitizeBaseCard
} from '@flashcards/shared'

import { LEVENSHTEIN_THRESHOLD } from '../constants'
import type { Card } from '../types'

/**
 * Normalize a string for comparison (lowercase, trim)
 */
export function normalizeString(str: string): string {
  return normalizeWhitespace(str).toLowerCase()
}

/**
 * Validates a typed answer against the correct answer(s)
 * Supports multiple possible answers separated by '/'
 * Handles language-specific rules (e.g., removing "to " prefix for DE->Voc)
 * Returns 'correct', 'close' (typo tolerance), or 'incorrect'
 */
export function validateTypingAnswer(
  userInput: string,
  correctAnswer: string,
  language: 'voc-de' | 'de-voc'
): AnswerStatus {
  const normalizedUserAnswer = normalizeString(userInput)
  const possibleAnswers = correctAnswer.split('/').map(normalizeString)

  // If DE->Voc, also accept answers without the leading "to "
  if (language === 'de-voc') {
    const answersWithoutTo = possibleAnswers
      .filter(ans => ans.startsWith('to '))
      .map(ans => ans.slice(3))
    possibleAnswers.push(...answersWithoutTo)
  }

  // Check for exact match
  if (possibleAnswers.includes(normalizedUserAnswer)) {
    return 'correct'
  }

  // Check for "close" answers using Levenshtein distance
  if (
    possibleAnswers.some(
      ans => levenshteinDistance(normalizedUserAnswer, ans) <= LEVENSHTEIN_THRESHOLD
    )
  ) {
    return 'close'
  }

  return 'incorrect'
}

function detectDelimiter(line: string): string | null {
  if (line.includes('\t')) return '\t'
  if (line.includes(';')) return ';'
  if (line.includes(',')) return ','
  if (line.includes('/')) return '/'
  return null
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
  const firstLine = lines[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  if (delimiter === null) {
    return null
  }

  const newCards: Card[] = []
  for (const [index, line] of lines.entries()) {
    if (index === 0 && line.toLowerCase().includes('voc') && line.toLowerCase().includes('de')) {
      continue // Skip header
    }

    const parts = line.split(delimiter)
    const voc = normalizeWhitespace(parts[0] ?? '')
    const de = normalizeWhitespace(parts[1] ?? '')
    if (voc !== '' && de !== '') {
      newCards.push(
        sanitizeBaseCard({
          voc,
          de,
          level: parseLevel(parts[2]),
          time: MAX_TIME
        })
      )
    }
  }

  return newCards.length > 0 ? { cards: newCards, delimiter } : null
}
