import { describe, expect, it } from 'vitest'

import { calculateLevelPoints, calculatePointsBreakdown } from './scoring'

describe('calculateLevelPoints', () => {
  it('should return 5 points for level 1', () => {
    expect(calculateLevelPoints(1)).toBe(5)
  })
  it('should return 4 points for level 2', () => {
    expect(calculateLevelPoints(2)).toBe(4)
  })
  it('should return 3 points for level 3', () => {
    expect(calculateLevelPoints(3)).toBe(3)
  })
  it('should return 2 points for level 4', () => {
    expect(calculateLevelPoints(4)).toBe(2)
  })
  it('should return 1 point for level 5', () => {
    expect(calculateLevelPoints(5)).toBe(1)
  })
})

describe('calculatePointsBreakdown', () => {
  it('should calculate basic points without bonuses', () => {
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

  it('should add time bonus when timeBonus is true and not close adjustment', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: true,
      closeAdjustment: false
    })

    expect(result.timeBonus).toBe(5)
    expect(result.totalPoints).toBe(20)
  })

  it('should not add time bonus when close adjustment is applied', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: true,
      closeAdjustment: true
    })

    expect(result.timeBonus).toBe(0)
    expect(result.closeAdjustment).toBe(4) // 15 - round(15 * 0.75) = 15 - 11 = 4
    expect(result.totalPoints).toBe(11) // 15 - 4 = 11
  })

  it('should apply close adjustment penalty', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 1,
      timeBonus: false,
      closeAdjustment: true
    })

    expect(result.closeAdjustment).toBe(4) // 15 - 11 = 4
    expect(result.totalPoints).toBe(11)
  })

  it('should add language bonus', () => {
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

  it('should handle combination of bonuses', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 10,
      level: 2, // levelPoints = 4
      timeBonus: true,
      closeAdjustment: false,
      languageBonus: 2
    })

    expect(result.levelPoints).toBe(4)
    expect(result.difficultyPoints).toBe(10)
    expect(result.pointsBeforeBonus).toBe(14)
    expect(result.timeBonus).toBe(5)
    expect(result.languageBonus).toBe(2)
    expect(result.closeAdjustment).toBe(0)
    expect(result.totalPoints).toBe(21) // 14 + 5 + 2
  })

  it('should handle close adjustment with language bonus', () => {
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

  it('should round close adjustment correctly', () => {
    const result = calculatePointsBreakdown({
      difficultyPoints: 7, // pointsBeforeBonus = 7 + 5 = 12
      level: 1,
      timeBonus: false,
      closeAdjustment: true
    })

    expect(result.pointsBeforeBonus).toBe(12)
    expect(result.closeAdjustment).toBe(3) // 12 - round(12 * 0.75) = 12 - 9 = 3
    expect(result.totalPoints).toBe(9)
  })
})
