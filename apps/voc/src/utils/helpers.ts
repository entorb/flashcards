import { levenshteinDistance, DEFAULT_TIME } from '@flashcards/shared'

import { LEVENSHTEIN_THRESHOLD } from '../constants'
import type { Card } from '../types'

/**
 * Normalize a string for comparison (lowercase, trim)
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim()
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
): 'correct' | 'close' | 'incorrect' {
  const normalizedUserAnswer = normalizeString(userInput)
  const possibleAnswers = correctAnswer.split('/').map(normalizeString)

  // If DE->Voc, also accept answers without the leading "to "
  if (language === 'de-voc') {
    const answersWithoutTo = possibleAnswers
      .filter(ans => ans.startsWith('to '))
      .map(ans => ans.substring(3))
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
  let delimiter: string
  if (firstLine.includes('\t')) delimiter = '\t'
  else if (firstLine.includes(';')) delimiter = ';'
  else if (firstLine.includes(',')) delimiter = ','
  else if (firstLine.includes('/')) delimiter = '/'
  else {
    return null // No valid delimiter found
  }

  const newCards: Card[] = []
  for (const [index, line] of lines.entries()) {
    if (index === 0 && line.toLowerCase().includes('voc') && line.toLowerCase().includes('de')) {
      continue // Skip header
    }

    const parts = line.split(delimiter)
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      newCards.push({
        voc: parts[0].trim(),
        de: parts[1].trim(),
        level: Number.parseInt(parts[2], 10) || 1,
        time: DEFAULT_TIME
      })
    }
  }

  return newCards.length > 0 ? { cards: newCards, delimiter } : null
}
