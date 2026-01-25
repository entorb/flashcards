/**
 * Shared Scoring Utilities
 * Common patterns for points calculation across apps
 */

import { CLOSE_MATCH_SCORE_PERCENTAGE, MAX_LEVEL, SPEED_BONUS_POINTS } from '../constants'

/**
 * Calculate base points from card level
 * Higher levels get fewer base points (Level 1 = 5pts, Level 5 = 1pt)
 *
 * @param level - Card difficulty level (1-5)
 * @returns Base points for the level
 *
 * @example
 * calculateBasePoints(1) // Returns 5
 * calculateBasePoints(5) // Returns 1
 */
export function calculateLevelPoints(level: number): number {
  return MAX_LEVEL + 1 - level
}

/**
 * Generic points calculation configuration
 */
export interface PointsConfig {
  difficultyPoints: number
  level: number
  timeBonus: boolean
  closeAdjustment: boolean
}

/**
 * Points breakdown interface for detailed scoring display
 */
export interface PointsBreakdown {
  levelPoints: number
  difficultyPoints: number
  pointsBeforeBonus: number
  closeAdjustment: number
  languageBonus: number
  timeBonus: number
  totalPoints: number
}

/**
 * Calculate detailed points breakdown for display
 * @param config - Configuration for points breakdown calculation
 * @returns PointsBreakdown object with detailed scoring information
 */
export function calculatePointsBreakdown(config: {
  difficultyPoints: number
  level: number
  timeBonus: boolean
  closeAdjustment: boolean
  languageBonus?: number
}): PointsBreakdown {
  const {
    difficultyPoints,
    level,
    timeBonus = false,
    closeAdjustment = false,
    languageBonus = 0
  } = config

  const levelPoints = calculateLevelPoints(level)
  const pointsBeforeBonus = difficultyPoints + levelPoints
  let totalPoints = pointsBeforeBonus
  let penalty = 0

  if (!closeAdjustment && timeBonus) {
    totalPoints += SPEED_BONUS_POINTS
  }
  if (closeAdjustment) {
    // penalty is a positive number representing points deducted
    penalty = totalPoints - Math.round(totalPoints * CLOSE_MATCH_SCORE_PERCENTAGE)
    totalPoints -= penalty
  }
  totalPoints += languageBonus

  return {
    levelPoints,
    difficultyPoints,
    pointsBeforeBonus,
    closeAdjustment: penalty,
    languageBonus,
    timeBonus: !closeAdjustment && timeBonus ? SPEED_BONUS_POINTS : 0,
    totalPoints
  }
}
