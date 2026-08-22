/**
 * Runtime validators for data loaded from storage.
 * Every loader validates parsed values against the expected shape and
 * falls back to defaults on mismatch, so corrupt or outdated storage
 * entries can never crash or poison the app.
 */

import { MAX_LEVEL, MIN_LEVEL } from '../constants'
import type { CardLevel } from '../types'

/** Non-null, non-array object */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Finite number (excludes NaN/Infinity) */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** Card level: integer within [MIN_LEVEL, MAX_LEVEL] */
export function isValidCardLevel(value: unknown): value is CardLevel {
  return isNumber(value) && Number.isInteger(value) && value >= MIN_LEVEL && value <= MAX_LEVEL
}

export function isArrayOfCardLevels(value: unknown): boolean {
  return Array.isArray(value) && value.every(isValidCardLevel)
}

const FOCUS_TYPES = new Set(['weak', 'medium', 'strong', 'slow'])

/** Base card fields: valid level + finite time */
export function isValidBaseCard(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { level, time } = value
  return isValidCardLevel(level) && isNumber(time)
}

/** BaseGameSettings fields: valid focus + levels array */
export function isValidBaseSettings(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { focus, levels } = value
  return typeof focus === 'string' && FOCUS_TYPES.has(focus) && isArrayOfCardLevels(levels)
}

/** GameStats shape: three numeric counters */
export function isValidGameStats(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { gamesPlayed, points, correctAnswers } = value
  return isNumber(gamesPlayed) && isNumber(points) && isNumber(correctAnswers)
}

/** DailyStats shape: date string + numeric counter */
export function isValidDailyStats(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { date, gamesPlayed } = value
  return isString(date) && isNumber(gamesPlayed)
}

/** GameResult shape (sessionStorage) */
export function isValidGameResult(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { points, correctAnswers, totalCards } = value
  return isNumber(points) && isNumber(correctAnswers) && isNumber(totalCards)
}

/** Minimal history entry shape shared by all games (BaseGameHistory) */
export function isValidHistoryEntry(value: unknown): boolean {
  if (!isRecord(value)) return false
  const { date, points, correctAnswers } = value
  return isString(date) && isNumber(points) && isNumber(correctAnswers)
}
