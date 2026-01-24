/**
 * Shared Scoring Utilities
 * Common patterns for points calculation across apps
 */

import { LEVEL_BONUS_NUMERATOR } from '../constants'

/**
 * Generic points calculation configuration
 */
export interface PointsConfig {
  level: number
  timeBonus?: number
  modeMultiplier?: number
  closeAdjustment?: number
  basePoints: number
}

/**
 * Calculate total points from component scores
 * Supports: base points + level bonus + time bonus + mode multiplier + close match adjustment
 *
 * @example
 * // 1x1: base=3, level=2, speedBonus=1
 * calculatePoints({ basePoints: 3, level: 2, timeBonus: 1 })
 * // Returns: 3 + (6-2) + 1 = 8
 *
 * @example
 * // voc: base=3, level=2, modeMultiplier=2, closeAdjustment=0.75
 * calculatePoints({ basePoints: 3, level: 2, modeMultiplier: 2, closeAdjustment: 0.75 })
 * // Returns: 3 * 2 * 0.75 + (6-2) = 4.5 + 4 = 8.5
 */
export function calculatePoints(config: PointsConfig): number {
  const { basePoints, level, timeBonus = 0, modeMultiplier = 1, closeAdjustment = 1 } = config

  const levelBonus = LEVEL_BONUS_NUMERATOR - level
  const pointsBeforeBonus = basePoints * modeMultiplier * closeAdjustment
  const totalPoints = pointsBeforeBonus + levelBonus + timeBonus

  return totalPoints
}
