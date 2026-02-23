import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  CLOSE_MATCH_SCORE_PERCENTAGE,
  MAX_LEVEL,
  MIN_LEVEL,
  SPEED_BONUS_POINTS
} from '../constants'
import { calculateLevelPoints, calculatePointsBreakdown } from './scoring'

describe('calculateLevelPoints', () => {
  it('returns 5 points for level 1', () => {
    expect(calculateLevelPoints(1)).toBe(5)
  })
  it('returns 4 points for level 2', () => {
    expect(calculateLevelPoints(2)).toBe(4)
  })
  it('returns 3 points for level 3', () => {
    expect(calculateLevelPoints(3)).toBe(3)
  })
  it('returns 2 points for level 4', () => {
    expect(calculateLevelPoints(4)).toBe(2)
  })
  it('returns 1 point for level 5', () => {
    expect(calculateLevelPoints(5)).toBe(1)
  })

  it('follows MAX_LEVEL + 1 - level formula', () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      expect(calculateLevelPoints(level)).toBe(MAX_LEVEL + 1 - level)
    }
  })
})

describe('calculatePointsBreakdown', () => {
  it('calculates basic points without bonuses', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: false,
      closeAdjustment: false
    })

    expect(result).toEqual({
      levelPoints: 5,
      difficultyPoints: 10,
      pointsBeforeBonus: 15,
      closeAdjustment: 0,
      languageBonus: 0,
      timeBonus: 0,
      totalPoints: 15
    })
  })

  it('adds time bonus when timeBonus is true and no close adjustment', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: true,
      closeAdjustment: false
    })

    expect(result.timeBonus).toBe(SPEED_BONUS_POINTS)
    expect(result.totalPoints).toBe(20)
  })

  it('does not add time bonus when close adjustment is applied', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: true,
      closeAdjustment: true
    })

    expect(result.timeBonus).toBe(0)
    expect(result.closeAdjustment).toBe(4) // 15 - round(15 * 0.75) = 15 - 11 = 4
    expect(result.totalPoints).toBe(11)
  })

  it('applies close adjustment penalty', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: false,
      closeAdjustment: true
    })

    expect(result.closeAdjustment).toBe(4) // 15 - round(15 * 0.75) = 4
    expect(result.totalPoints).toBe(11)
  })

  it('adds language bonus', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: false,
      closeAdjustment: false,
      languageBonus: 3
    })

    expect(result.languageBonus).toBe(3)
    expect(result.totalPoints).toBe(18)
  })

  it('handles combination of time bonus and language bonus', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 2,
      timeBonus: true,
      closeAdjustment: false,
      languageBonus: 2
    })

    expect(result.levelPoints).toBe(4)
    expect(result.pointsBeforeBonus).toBe(14)
    expect(result.timeBonus).toBe(SPEED_BONUS_POINTS)
    expect(result.languageBonus).toBe(2)
    expect(result.closeAdjustment).toBe(0)
    expect(result.totalPoints).toBe(21) // 14 + 5 + 2
  })

  it('handles close adjustment with language bonus', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: false,
      closeAdjustment: true,
      languageBonus: 2
    })

    expect(result.closeAdjustment).toBe(4)
    expect(result.languageBonus).toBe(2)
    expect(result.totalPoints).toBe(13) // 15 - 4 + 2
  })

  it('rounds close adjustment correctly', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 7, // pointsBeforeBonus = 7 + 5 = 12
      level: 1,
      timeBonus: false,
      closeAdjustment: true
    })

    expect(result.pointsBeforeBonus).toBe(12)
    // penalty = 12 - round(12 * 0.75) = 12 - 9 = 3
    expect(result.closeAdjustment).toBe(3)
    expect(result.totalPoints).toBe(9)
  })

  it('handles zero difficultyPoints', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 0,
      level: 5,
      timeBonus: false,
      closeAdjustment: false
    })

    expect(result.levelPoints).toBe(1)
    expect(result.difficultyPoints).toBe(0)
    expect(result.pointsBeforeBonus).toBe(1)
    expect(result.totalPoints).toBe(1)
  })

  it('defaults languageBonus to 0 when not provided', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 5,
      level: 3,
      timeBonus: false,
      closeAdjustment: false
    })

    expect(result.languageBonus).toBe(0)
  })

  it('close adjustment uses CLOSE_MATCH_SCORE_PERCENTAGE constant', () => {
    const difficultyPoints = 8
    const level = 2 // levelPoints = 4, pointsBeforeBonus = 12
    const result = calculatePointsBreakdown({
      difficultyPoints,
      level,
      timeBonus: false,
      closeAdjustment: true
    })

    const pointsBeforeBonus = difficultyPoints + calculateLevelPoints(level)
    const expectedAfterPenalty = Math.round(pointsBeforeBonus * CLOSE_MATCH_SCORE_PERCENTAGE)
    expect(result.totalPoints).toBe(expectedAfterPenalty)
  })
})

/**
 * Property-Based Tests
 * Validates: Requirements 7.3
 */
describe('scoring — property tests', () => {
  it('totalPoints is always >= 0 for any valid input combination', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        fc.boolean(),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        (difficultyPoints, level, timeBonus, closeAdjustment, languageBonus) => {
          const result = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus,
            closeAdjustment,
            languageBonus
          })
          return result.totalPoints >= 0
        }
      )
    )
  })

  it('totalPoints with no bonuses equals difficultyPoints + levelPoints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        (difficultyPoints, level) => {
          const result = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus: false,
            closeAdjustment: false
          })
          return result.totalPoints === difficultyPoints + calculateLevelPoints(level)
        }
      )
    )
  })

  it('close adjustment always reduces or keeps totalPoints (never increases)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        (difficultyPoints, level) => {
          const withClose = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus: false,
            closeAdjustment: true
          })
          const withoutClose = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus: false,
            closeAdjustment: false
          })
          return withClose.totalPoints <= withoutClose.totalPoints
        }
      )
    )
  })

  it('time bonus adds exactly SPEED_BONUS_POINTS when no close adjustment', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        fc.integer({ min: 0, max: 10 }),
        (difficultyPoints, level, languageBonus) => {
          const withBonus = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus: true,
            closeAdjustment: false,
            languageBonus
          })
          const withoutBonus = calculatePointsBreakdown({
            difficultyPoints,
            level,
            timeBonus: false,
            closeAdjustment: false,
            languageBonus
          })
          return withBonus.totalPoints - withoutBonus.totalPoints === SPEED_BONUS_POINTS
        }
      )
    )
  })
})
