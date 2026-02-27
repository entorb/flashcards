import {
  MAX_LEVEL,
  MAX_TIME,
  MIN_LEVEL,
  MIN_TIME,
  PROD_HOSTNAME,
  STATS_PENDING_STORAGE_KEY,
  WEB_STATS_URL
} from '../constants'
import { TEXT_DE } from '../text-de'
import type { DailyBonusConfig } from '../types'

/**
 * Get focus type text from focus value
 * @param focus - The focus type ('weak', 'strong', or 'slow')
 * @returns The localized focus text
 */
export const getFocusText = (focus: string): string => {
  switch (focus) {
    case 'weak':
      return TEXT_DE.shared.focusOptions.weak
    case 'medium':
      return TEXT_DE.shared.focusOptions.medium
    case 'strong':
      return TEXT_DE.shared.focusOptions.strong
    default:
      return TEXT_DE.shared.focusOptions.slow
  }
}

/**
 * Fetch app stats from database
 * @param basePath - The app identifier (e.g., '1x1', 'voc')
 * @returns number of games completed metered, or 0 on error
 */
export const helperStatsDataRead = async (basePath: string): Promise<number> => {
  try {
    const url = `${WEB_STATS_URL}?origin=${basePath}&action=read`
    const response = await fetch(url)

    if (!response.ok) {
      return 0
    }

    const respData = await response.json()
    if (typeof respData.accesscounts === 'number' && respData.accesscounts >= 0) {
      return respData.accesscounts
    }

    return 0
  } catch {
    // Silently fail - stats are not critical for app functionality
    return 0
  }
}

/**
 * Load pending stats counts from localStorage
 */
function loadPendingStats(): Record<string, number> {
  try {
    const stored = globalThis.localStorage.getItem(STATS_PENDING_STORAGE_KEY)
    if (stored === null || stored === '') return {}
    return JSON.parse(stored) as Record<string, number>
  } catch {
    return {}
  }
}

/**
 * Save pending stats counts to localStorage
 */
function savePendingStats(pending: Record<string, number>): void {
  try {
    globalThis.localStorage.setItem(STATS_PENDING_STORAGE_KEY, JSON.stringify(pending))
  } catch {
    // Storage full or unavailable — nothing we can do
  }
}

/**
 * Send a single stats write request
 * @returns true if the request succeeded, false otherwise
 */
async function sendStatsWrite(basePath: string): Promise<boolean> {
  try {
    const url = `${WEB_STATS_URL}?origin=${basePath}&action=write`
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Send pending writes for a single app one by one, returning the number that succeeded.
 * Stops at the first failure (still offline).
 */
async function flushAppPending(app: string, count: number): Promise<number> {
  let sent = 0
  for (let i = 0; i < count; i++) {
    const ok = await sendStatsWrite(app)
    if (!ok) break
    sent++
  }
  return sent
}

/**
 * Remove zero-count entries and persist (or clear) the pending map.
 */
function persistCleanedPending(pending: Record<string, number>): void {
  const cleaned: Record<string, number> = {}
  for (const [app, count] of Object.entries(pending)) {
    if (count > 0) cleaned[app] = count
  }
  if (Object.keys(cleaned).length === 0) {
    globalThis.localStorage.removeItem(STATS_PENDING_STORAGE_KEY)
  } else {
    savePendingStats(cleaned)
  }
}

/**
 * Flush all pending (cached) stats writes for every app.
 * Sends them one by one; any that still fail stay in the cache.
 */
async function flushPendingStats(): Promise<void> {
  const pending = loadPendingStats()
  let changed = false

  for (const [app, count] of Object.entries(pending)) {
    const sent = await flushAppPending(app, count)
    if (sent > 0) {
      pending[app] = count - sent
      changed = true
    }
    if (sent < count) {
      // Still offline — stop trying further apps
      break
    }
  }

  if (changed) {
    persistCleanedPending(pending)
  }
}

/**
 * Write app stats to database.
 * If the device is offline the call is cached in localStorage and
 * retried automatically on the next successful invocation.
 * @param basePath - The app identifier (1x1, voc, lwk, eta)
 */
export const helperStatsDataWrite = async (basePath: string): Promise<void> => {
  // Skip stats writes outside production to prevent dev/Cypress from spoiling stats
  try {
    if (globalThis.location.hostname !== PROD_HOSTNAME) return
  } catch {
    return
  }

  const ok = await sendStatsWrite(basePath)

  if (ok) {
    // Current write succeeded — also flush any previously cached writes
    await flushPendingStats()
  } else {
    // Offline — cache this write for later
    const pending = loadPendingStats()
    pending[basePath] = (pending[basePath] ?? 0) + 1
    savePendingStats(pending)
  }
}

/**
 * Daily bonus calculation for game over page
 * @param dailyInfo - Daily games info from incrementDailyGames()
 * @param bonusConfig - Bonus configuration with point values
 * @returns Array of bonus reasons with their point values
 */
export const calculateDailyBonuses = (
  dailyInfo: { isFirstGame: boolean; gamesPlayedToday: number },
  bonusConfig: DailyBonusConfig
): Array<{ label: string; points: number }> => {
  const bonuses: Array<{ label: string; points: number }> = []

  if (dailyInfo.isFirstGame) {
    bonuses.push({
      label: TEXT_DE.shared.words.firstGameBonus,
      points: bonusConfig.firstGameBonus
    })
  }

  if (
    bonusConfig.streakGameInterval > 0 &&
    dailyInfo.gamesPlayedToday > 0 &&
    dailyInfo.gamesPlayedToday % bonusConfig.streakGameInterval === 0
  ) {
    bonuses.push({
      label: TEXT_DE.shared.words.streakGameBonus,
      points: bonusConfig.streakGameBonus
    })
  }

  return bonuses
}

/**
 * Initialize the Levenshtein distance matrix
 */
function initLevenshteinMatrix(len1: number, len2: number): number[][] {
  const matrix: number[][] = []
  for (let i = 0; i <= len1; i++) {
    const row = new Array<number>(len2 + 1)
    row[0] = i
    matrix[i] = row
  }

  const firstRow = matrix[0]
  if (firstRow) {
    for (let j = 1; j <= len2; j++) {
      firstRow[j] = j
    }
  }

  return matrix
}

/**
 * Fill a single cell in the Levenshtein matrix
 */
function fillMatrixCell(row: number[], prevRow: number[], j: number, cost: number): void {
  const deletion = prevRow[j]
  const insertion = row[j - 1]
  const substitution = prevRow[j - 1]

  if (deletion !== undefined && insertion !== undefined && substitution !== undefined) {
    row[j] = Math.min(deletion + 1, insertion + 1, substitution + cost)
  }
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy string matching in spelling and typing validation
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  const matrix = initLevenshteinMatrix(len1, len2)

  // Fill matrix using dynamic programming
  for (let i = 1; i <= len1; i++) {
    const row = matrix[i]
    const prevRow = matrix[i - 1]
    if (row && prevRow) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        fillMatrixCell(row, prevRow, j, cost)
      }
    }
  }

  const lastRow = matrix[len1]
  const result = lastRow?.[len2]
  return result ?? 0
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Localized date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Round time to 1 decimal place
 * @param seconds - Time in seconds
 * @returns Rounded time
 */
export function roundTime(seconds: number): number {
  return Math.round(seconds * 10) / 10
}

/**
 * Parse level from string with validation
 * @param levelStr - String to parse as level number (undefined treated as empty)
 * @returns Parsed level number, or MIN_LEVEL if invalid
 */
export function parseLevel(levelStr: string | undefined): number {
  if (levelStr === undefined || levelStr.length === 0) return MIN_LEVEL
  const parsed = Number.parseInt(levelStr, 10)
  if (Number.isNaN(parsed) || parsed < MIN_LEVEL || parsed > MAX_LEVEL) {
    return MIN_LEVEL
  }
  return parsed
}

/**
 * Sanitize base card fields: clamp level to valid range, default time to MAX_TIME
 * Use this when creating or importing cards to ensure valid defaults.
 */
export function sanitizeBaseCard<T extends { level?: number; time?: number }>(
  card: T
): T & { level: number; time: number } {
  const level = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, card.level ?? MIN_LEVEL))
  const time = Math.max(MIN_TIME, Math.min(MAX_TIME, card.time ?? MAX_TIME))
  return { ...card, level, time }
}
