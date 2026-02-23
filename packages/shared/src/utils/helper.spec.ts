import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  calculateDailyBonuses,
  formatDate,
  getFocusText,
  helperStatsDataRead,
  helperStatsDataWrite,
  levenshteinDistance,
  roundTime
} from '../utils/helper'

describe('getFocusText', () => {
  it('returns weak text for "weak"', () => {
    expect(getFocusText('weak')).toBe('Schwache')
  })

  it('returns medium text for "medium"', () => {
    expect(getFocusText('medium')).toBe('Mittlere')
  })

  it('returns strong text for "strong"', () => {
    expect(getFocusText('strong')).toBe('Starke')
  })

  it('returns slow text for "slow"', () => {
    expect(getFocusText('slow')).toBe('Langsame')
  })

  it('returns slow text for unknown values (default case)', () => {
    expect(getFocusText('unknown')).toBe('Langsame')
    expect(getFocusText('')).toBe('Langsame')
    expect(getFocusText('WEAK')).toBe('Langsame')
  })
})

describe('calculateDailyBonuses', () => {
  const bonusConfig = {
    firstGameBonus: 5,
    streakGameBonus: 5,
    streakGameInterval: 5
  }

  it('returns first game bonus for first game of the day', () => {
    const dailyInfo = { isFirstGame: true, gamesPlayedToday: 1 }
    const bonuses = calculateDailyBonuses(dailyInfo, bonusConfig)

    expect(bonuses).toHaveLength(1)
    expect(bonuses[0]).toEqual({
      label: 'Erstes Spiel heute',
      points: 5
    })
  })

  it('returns streak bonus every Nth game', () => {
    const dailyInfo = { isFirstGame: false, gamesPlayedToday: 5 }
    const bonuses = calculateDailyBonuses(dailyInfo, bonusConfig)

    expect(bonuses).toHaveLength(1)
    expect(bonuses[0]).toEqual({
      label: 'Spiel des Tages',
      points: 5
    })
  })

  it('returns both bonuses when first game AND streak game', () => {
    const dailyInfo = { isFirstGame: true, gamesPlayedToday: 5 }
    const bonuses = calculateDailyBonuses(dailyInfo, bonusConfig)

    expect(bonuses).toHaveLength(2)
    expect(bonuses[0]).toEqual({ label: 'Erstes Spiel heute', points: 5 })
    expect(bonuses[1]).toEqual({ label: 'Spiel des Tages', points: 5 })
  })

  it('returns empty array when no bonuses apply', () => {
    const dailyInfo = { isFirstGame: false, gamesPlayedToday: 3 }
    expect(calculateDailyBonuses(dailyInfo, bonusConfig)).toHaveLength(0)
  })

  it('returns streak bonus at multiples of streakGameInterval', () => {
    for (const n of [5, 10, 15, 20]) {
      const bonuses = calculateDailyBonuses(
        { isFirstGame: false, gamesPlayedToday: n },
        bonusConfig
      )
      expect(bonuses).toEqual([{ label: 'Spiel des Tages', points: 5 }])
    }
  })

  it('respects custom bonus config values', () => {
    const customConfig = { firstGameBonus: 10, streakGameBonus: 3, streakGameInterval: 3 }
    const bonuses = calculateDailyBonuses({ isFirstGame: true, gamesPlayedToday: 3 }, customConfig)
    expect(bonuses).toEqual([
      { label: 'Erstes Spiel heute', points: 10 },
      { label: 'Spiel des Tages', points: 3 }
    ])
  })
})

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0)
    expect(levenshteinDistance('', '')).toBe(0)
  })

  it('returns length of string when other is empty', () => {
    expect(levenshteinDistance('abc', '')).toBe(3)
    expect(levenshteinDistance('', 'abc')).toBe(3)
  })

  it('returns 1 for single insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1)
    expect(levenshteinDistance('cats', 'cat')).toBe(1)
  })

  it('returns 1 for single substitution', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1)
  })

  it('returns 1 for single deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1)
  })

  it('calculates distance for completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3)
  })

  it('is symmetric', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(levenshteinDistance('sitting', 'kitten'))
  })

  it('handles typical typo corrections', () => {
    // one transposition-like edit
    expect(levenshteinDistance('helo', 'hello')).toBe(1)
    expect(levenshteinDistance('teh', 'the')).toBe(2)
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date string to German locale', () => {
    const result = formatDate('2024-01-15T10:30:00')
    // German locale: dd.mm.yyyy, hh:mm
    expect(result).toMatch(/15\.01\.2024/)
    expect(result).toMatch(/10:30/)
  })

  it('formats midnight correctly', () => {
    const result = formatDate('2024-06-01T00:00:00')
    expect(result).toMatch(/01\.06\.2024/)
    expect(result).toMatch(/00:00/)
  })

  it('returns a non-empty string for any valid date', () => {
    const result = formatDate('2000-12-31T23:59:00')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toMatch(/31\.12\.2000/)
  })
})

describe('roundTime', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundTime(1.25)).toBe(1.3)
    expect(roundTime(1.24)).toBe(1.2)
  })

  it('returns exact value when already 1 decimal', () => {
    expect(roundTime(3.5)).toBe(3.5)
    expect(roundTime(10.0)).toBe(10)
  })

  it('handles zero', () => {
    expect(roundTime(0)).toBe(0)
  })

  it('handles negative values', () => {
    expect(roundTime(-1.25)).toBe(-1.2)
    // Math.round(-13.5) = -13 (rounds toward +∞), so -1.35 rounds to -1.3
    expect(roundTime(-1.35)).toBe(-1.3)
  })

  it('handles large values', () => {
    expect(roundTime(999.99)).toBe(1000)
    expect(roundTime(100.05)).toBe(100.1)
  })
})

describe('helperStatsDataRead', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns accesscounts from successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ accesscounts: 42 })
      })
    )
    const result = await helperStatsDataRead('1x1')
    expect(result).toBe(42)
  })

  it('returns 0 when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn()
      })
    )
    const result = await helperStatsDataRead('1x1')
    expect(result).toBe(0)
  })

  it('returns 0 when accesscounts is missing from response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ other: 'data' })
      })
    )
    const result = await helperStatsDataRead('1x1')
    expect(result).toBe(0)
  })

  it('returns 0 when accesscounts is negative', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ accesscounts: -1 })
      })
    )
    const result = await helperStatsDataRead('1x1')
    expect(result).toBe(0)
  })

  it('returns 0 when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await helperStatsDataRead('1x1')
    expect(result).toBe(0)
  })
})

describe('helperStatsDataWrite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls fetch with correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('fetch', fetchMock)
    await helperStatsDataWrite('voc')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('voc'))
  })

  it('does not throw when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    await expect(helperStatsDataWrite('lwk')).resolves.toBeUndefined()
  })
})

/**
 * Property-Based Tests
 * Validates mathematical properties of levenshteinDistance algorithm
 */
describe('levenshteinDistance — property tests', () => {
  it('is symmetric: d(a,b) = d(b,a)', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return levenshteinDistance(a, b) === levenshteinDistance(b, a)
      })
    )
  })

  it('satisfies triangle inequality: d(a,c) <= d(a,b) + d(b,c)', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        const dAC = levenshteinDistance(a, c)
        const dAB = levenshteinDistance(a, b)
        const dBC = levenshteinDistance(b, c)
        return dAC <= dAB + dBC
      })
    )
  })

  it('identity: d(a,a) = 0', () => {
    fc.assert(
      fc.property(fc.string(), a => {
        return levenshteinDistance(a, a) === 0
      })
    )
  })

  it('is always non-negative', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return levenshteinDistance(a, b) >= 0
      })
    )
  })

  it('distance to empty string equals string length', () => {
    fc.assert(
      fc.property(fc.string(), a => {
        return levenshteinDistance(a, '') === a.length && levenshteinDistance('', a) === a.length
      })
    )
  })
})
