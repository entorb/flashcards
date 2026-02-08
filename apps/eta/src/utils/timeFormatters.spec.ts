import { describe, it, expect } from 'vitest'

import { formatDuration, formatClockTime, getTimeDiffSeconds } from './timeFormatters'

describe('formatDuration', () => {
  it('should format seconds as MM:SS', () => {
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(59)).toBe('00:59')
    expect(formatDuration(0)).toBe('00:00')
  })

  it('should format seconds as HH:MM:SS when hours > 0', () => {
    expect(formatDuration(3661)).toBe('01:01:01')
    expect(formatDuration(7265)).toBe('02:01:05')
  })
})

describe('formatClockTime', () => {
  it('should format date as HH:MM', () => {
    const date = new Date('2024-01-01T14:30:00')
    expect(formatClockTime(date)).toBe('14:30')

    const midnight = new Date('2024-01-01T00:05:00')
    expect(formatClockTime(midnight)).toBe('00:05')
  })
})

describe('getTimeDiffSeconds', () => {
  it('should calculate time difference in seconds', () => {
    const start = new Date('2024-01-01T10:00:00')
    const end = new Date('2024-01-01T10:05:30')

    const result = getTimeDiffSeconds(start, end)

    expect(result).toBe(330) // 5 minutes 30 seconds
  })

  it('should handle negative differences', () => {
    const start = new Date('2024-01-01T10:05:00')
    const end = new Date('2024-01-01T10:00:00')

    const result = getTimeDiffSeconds(start, end)

    expect(result).toBe(-300)
  })
})
