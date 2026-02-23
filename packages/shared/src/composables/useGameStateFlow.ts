/**
 * Centralized Game State Flow Management
 * Handles simplified no-parallel-sessions game flow across all apps
 *
 * Pattern:
 * 1. HomePage → Store settings to localStorage + selected cards to sessionStorage
 * 2. GamePage → Read from sessionStorage, update cards in localStorage, track stats in sessionStorage
 * 3. GameOverPage → Transfer stats to localStorage with bonuses
 */

import {
  incrementDailyGames,
  loadJSON,
  loadSessionJSON,
  saveJSON,
  saveSessionJSON
} from '../services/storage'
import type { DailyBonusConfig, GameResult, GameStats } from '../types'

export interface GameStateFlowConfig {
  /** localStorage key for game settings */
  settingsKey: string
  /** sessionStorage key for selected cards */
  selectedCardsKey: string
  /** sessionStorage key for game result */
  gameResultKey: string
  /** localStorage key for game history */
  historyKey: string
  /** localStorage key for game statistics */
  statsKey: string
  /** sessionStorage key for daily stats */
  dailyStatsKey: string
}

/**
 * Initialize game flow by storing settings and selected cards
 * Called from HomePage when user clicks "Start Game"
 */
export function initializeGameFlow<TSettings, TCard>(
  config: GameStateFlowConfig,
  settings: TSettings,
  selectedCards: TCard[]
): void {
  // Store game settings to localStorage (persists across sessions)
  saveJSON(config.settingsKey, settings)

  // Store selected cards to sessionStorage (for this game only)
  saveSessionJSON(config.selectedCardsKey, selectedCards)
}

/**
 * Get selected cards for current game
 * Called from GamePage on mount
 */
export function getGameCards<TCard>(config: GameStateFlowConfig): TCard[] {
  return loadSessionJSON<TCard[]>(config.selectedCardsKey, [])
}

/**
 * Remove card from game (after answer is provided)
 * Called from GamePage after handling answer
 */
export function removeCardFromGame<TCard>(config: GameStateFlowConfig, cardIndex: number): void {
  const cards = getGameCards<TCard>(config)
  if (cardIndex < 0 || cardIndex >= cards.length) {
    throw new Error(
      `Internal error in removeCardFromGame: Invalid card index ${cardIndex} (valid range: 0-${cards.length - 1}). This may indicate a bug in the game state management.`
    )
  }
  cards.splice(cardIndex, 1)
  saveSessionJSON(config.selectedCardsKey, cards)
}

/**
 * Update game statistics in session state
 * Called from GamePage as user plays
 */
export function updateGameStats(
  config: GameStateFlowConfig,
  points: number,
  correctAnswers: number,
  totalCards: number
): void {
  const result: GameResult = { points, correctAnswers, totalCards }
  saveSessionJSON(config.gameResultKey, result)
}

/**
 * Transfer game results from sessionStorage to localStorage with bonuses
 * Called from GameOverPage onMounted
 *
 * @returns Object with bonus info and updated game stats
 */
export function transferGameResultsWithBonuses<THistory extends { date: string; points: number }>(
  config: GameStateFlowConfig,
  bonusConfig: DailyBonusConfig,
  historyEntry: THistory,
  saveHistoryFn: (history: THistory[]) => void,
  saveStatsFn: (stats: GameStats) => void
): {
  bonusPoints: number
  totalPoints: number
  dailyInfo: { isFirstGame: boolean; gamesPlayedToday: number }
} {
  // Get game result from sessionStorage
  const result = loadSessionJSON<GameResult | null>(config.gameResultKey, null)
  if (!result) {
    throw new Error('No game result found in sessionStorage')
  }

  // Calculate daily bonuses
  const dailyInfo = incrementDailyGames(config.dailyStatsKey)
  let bonusPoints = 0

  if (dailyInfo.isFirstGame) {
    bonusPoints += bonusConfig.firstGameBonus
  }

  // Every Nth game bonus (e.g., every 5th game)
  if (
    dailyInfo.gamesPlayedToday > 0 &&
    dailyInfo.gamesPlayedToday % bonusConfig.streakGameInterval === 0
  ) {
    bonusPoints += bonusConfig.streakGameBonus
  }

  const finalPoints = result.points + bonusPoints

  // Mutate provided history entry to include the bonus points
  historyEntry.points = finalPoints

  // Load existing history and append new entry
  const historyList = loadJSON<THistory[]>(config.historyKey, [])
  historyList.push(historyEntry)

  // Load and update stats
  const defaultStats: GameStats = { gamesPlayed: 0, points: 0, correctAnswers: 0 }
  const stats = loadJSON<GameStats>(config.statsKey, defaultStats)
  stats.gamesPlayed++
  stats.points += finalPoints
  stats.correctAnswers += result.correctAnswers

  // Single save to localStorage (atomically save both)
  saveHistoryFn(historyList)
  saveStatsFn(stats)

  return {
    bonusPoints,
    totalPoints: finalPoints,
    dailyInfo
  }
}

/**
 * Clear all game session data from sessionStorage
 * Called from GameOverPage when navigating home
 */
export function clearGameSessionData(config: GameStateFlowConfig): void {
  globalThis.sessionStorage.removeItem(config.selectedCardsKey)
  globalThis.sessionStorage.removeItem(config.gameResultKey)
}

/**
 * Get last game settings from localStorage
 * Useful for HomePage to remember user's last game settings
 */
export function getLastGameSettings<TSettings>(
  config: GameStateFlowConfig,
  fallback: TSettings
): TSettings {
  return loadJSON<TSettings>(config.settingsKey, fallback)
}
