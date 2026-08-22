/**
 * App Storage Factory
 * Generates boilerplate storage functions shared between 1x1 and div apps.
 * Each app provides app-specific config (storage keys, default range, card creation).
 */

import { MAX_TIME, MIN_LEVEL, MIN_TIME } from '../constants'
import type { BaseCard, CardLevel, GameResult, GameStats, SessionMode } from '../types'
import {
  isNumber,
  isRecord,
  isString,
  isValidBaseCard,
  isValidBaseSettings,
  isValidHistoryEntry
} from '../utils/validators'

import {
  createAppGameStorage,
  createGamePersistence,
  createHistoryOperations,
  createStatsOperations,
  loadArray,
  loadJSON,
  saveJSON
} from './storage'

export interface AppStorageConfig<TCard extends BaseCard> {
  storageKeys: {
    CARDS: string
    HISTORY: string
    STATS: string
    SETTINGS: string
    GAME_CONFIG: string
    SELECTED_CARDS: string
    GAME_RESULT: string
    DAILY_STATS: string
    GAME_STATE: string
    RANGE: string
  }
  defaultRange: number[]
  createCardFromQuestion: (question: string) => TCard
  /** Extra settings field checks beyond focus/levels (e.g. app-specific mode/select) */
  isValidSettings?: (value: unknown) => boolean
}

export interface AppGameState<TCard> {
  gameCards: TCard[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
  sessionMode?: SessionMode
  initialCardCount?: number
}

/**
 * Create app-specific storage operations from a shared config.
 * Returns all the boilerplate storage functions that are identical between apps.
 */
export function createAppStorageFactory<
  TCard extends BaseCard & { question: string },
  THistory,
  TSettings extends { levels?: CardLevel[] }
>(config: AppStorageConfig<TCard>) {
  const { storageKeys, defaultRange, createCardFromQuestion } = config

  /** Card shape check: app key fields + valid BaseCard level/time */
  const isValidStoredCard = (value: unknown): boolean => {
    if (!(isRecord(value) && isValidBaseCard(value))) return false
    const { question } = value
    return isString(question) && question.length > 0
  }

  /** Range shape check: non-empty array of integers */
  const isValidRange = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => isNumber(item) && Number.isInteger(item))

  // Game persistence factory for session storage
  const gamePersistence = createGamePersistence<TSettings, AppGameState<TCard>>(
    storageKeys.GAME_CONFIG,
    storageKeys.GAME_STATE,
    config.isValidSettings ?? isValidBaseSettings
  )

  // History operations
  const historyOps = createHistoryOperations<THistory>(storageKeys.HISTORY, isValidHistoryEntry)

  // Stats operations
  const statsOps = createStatsOperations<GameStats>(storageKeys.STATS, {
    gamesPlayed: 0,
    points: 0,
    correctAnswers: 0
  })

  // Game storage (result, daily stats, game state clear)
  const gameStorage = createAppGameStorage(
    storageKeys.GAME_RESULT,
    storageKeys.GAME_STATE,
    storageKeys.DAILY_STATS
  )

  // ── Card Operations ─────────────────────────────────────────────────

  function loadCards(): TCard[] {
    return loadArray<TCard>(storageKeys.CARDS, [], isValidStoredCard)
  }

  function saveCards(cards: TCard[]): void {
    saveJSON(storageKeys.CARDS, cards)
  }

  function updateCard(question: string, updates: Partial<TCard>): void {
    const cards = loadCards()
    const index = cards.findIndex(c => c.question === question)

    // Clamp time within allowed range
    if (updates.time !== undefined) {
      updates.time = Math.max(MIN_TIME, Math.min(MAX_TIME, updates.time))
    }

    if (index === -1) {
      // Card doesn't exist yet, create it (lazy loading)
      const newCard = createCardFromQuestion(question)
      cards.push({
        ...newCard,
        level: updates.level ?? MIN_LEVEL,
        time: updates.time ?? MAX_TIME
      })
    } else {
      // Card exists, update it
      const existing = cards[index]
      if (existing) {
        cards[index] = { ...existing, ...updates }
      }
    }

    saveCards(cards)
  }

  function resetCards(): void {
    const cards = loadCards()
    for (const card of cards) {
      card.level = MIN_LEVEL
      card.time = MAX_TIME
    }
    saveCards(cards)
  }

  // ── History ─────────────────────────────────────────────────────────

  function loadHistory(): THistory[] {
    return historyOps.load()
  }

  function saveHistory(history: THistory[]): void {
    historyOps.save(history)
  }

  function addHistory(entry: THistory): void {
    historyOps.add(entry)
  }

  // ── Statistics ──────────────────────────────────────────────────────

  function loadGameStats(): GameStats {
    return statsOps.load()
  }

  function saveGameStats(stats: GameStats): void {
    statsOps.save(stats)
  }

  function updateStatistics(points: number, correctAnswers: number): void {
    statsOps.update(points, correctAnswers)
  }

  // ── Game Configuration (Session Storage) ────────────────────────────

  function setGameConfig(gameConfig: TSettings): void {
    gamePersistence.saveSettings(gameConfig)
  }

  function getGameConfig(): TSettings | null {
    return gamePersistence.loadSettings()
  }

  // ── Game Result (Session Storage) ───────────────────────────────────

  function setGameResult(result: GameResult): void {
    gameStorage.setGameResult(result)
  }

  function getGameResult(): GameResult | null {
    return gameStorage.getGameResult()
  }

  function clearGameResult(): void {
    gameStorage.clearGameResult()
  }

  // ── Daily Stats ─────────────────────────────────────────────────────

  function incrementDailyGames(): { isFirstGame: boolean; gamesPlayedToday: number } {
    return gameStorage.incrementDailyGames()
  }

  // ── Game State (Session Storage) ────────────────────────────────────

  function saveGameState(state: AppGameState<TCard>): void {
    gamePersistence.saveState(state)
  }

  function loadGameState(): AppGameState<TCard> | null {
    return gamePersistence.loadState()
  }

  function clearGameState(): void {
    gameStorage.clearGameState()
  }

  // ── Range Configuration ─────────────────────────────────────────────

  function loadRange(): number[] {
    return loadJSON<number[]>(storageKeys.RANGE, [...defaultRange], isValidRange)
  }

  function saveRange(range: number[]): void {
    saveJSON(storageKeys.RANGE, range)
  }

  // ── Settings (localStorage) ─────────────────────────────────────────

  function loadSettings(): TSettings | null {
    return loadJSON<TSettings | null>(
      storageKeys.SETTINGS,
      null,
      config.isValidSettings ?? isValidBaseSettings
    )
  }

  function saveSettings(settings: TSettings): void {
    saveJSON(storageKeys.SETTINGS, settings)
  }

  // ── Reset All ───────────────────────────────────────────────────────

  function resetAll(): void {
    globalThis.localStorage.removeItem(storageKeys.CARDS)
    globalThis.localStorage.removeItem(storageKeys.HISTORY)
    globalThis.localStorage.removeItem(storageKeys.STATS)
    globalThis.localStorage.removeItem(storageKeys.SETTINGS)
    globalThis.localStorage.removeItem(storageKeys.DAILY_STATS)
    globalThis.localStorage.removeItem(storageKeys.RANGE)
    globalThis.sessionStorage.removeItem(storageKeys.GAME_RESULT)
    gamePersistence.clearAll()
  }

  return {
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
  }
}
