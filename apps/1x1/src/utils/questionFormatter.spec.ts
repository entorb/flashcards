import { describe, expect, it } from 'vitest'

import { formatDisplayQuestion } from './questionFormatter'

describe('formatDisplayQuestion', () => {
  it('replaces x with multiplication sign by default', () => {
    expect(formatDisplayQuestion('3x4', undefined)).toBe('3\u00d74')
  })

  it('replaces x with multiplication sign for multi-number selection', () => {
    expect(formatDisplayQuestion('3x4', [3, 4, 5])).toBe('3\u00d74')
  })

  it('replaces x with multiplication sign for x² selection', () => {
    expect(formatDisplayQuestion('3x3', 'x²')).toBe('3\u00d73')
  })

  it('replaces x with multiplication sign for "all" selection', () => {
    expect(formatDisplayQuestion('5x3', 'all')).toBe('5\u00d73')
  })

  describe('single number selection', () => {
    it('rearranges so selected number is last (y matches)', () => {
      // question "5x3", selected [5] → "3×5"
      expect(formatDisplayQuestion('5x3', [5])).toBe('3\u00d75')
    })

    it('rearranges so selected number is last (x matches)', () => {
      // question "5x3", selected [3] → "5×3"
      expect(formatDisplayQuestion('5x3', [3])).toBe('5\u00d73')
    })

    it('handles case where selected number matches both operands', () => {
      // question "3x3", selected [3] → "3×3"
      expect(formatDisplayQuestion('3x3', [3])).toBe('3\u00d73')
    })

    it('falls back to default when selected number matches neither operand', () => {
      // question "5x3", selected [7] → "5×3" (default replacement)
      expect(formatDisplayQuestion('5x3', [7])).toBe('5\u00d73')
    })
  })

  it('handles empty array selection as default', () => {
    expect(formatDisplayQuestion('3x4', [])).toBe('3\u00d74')
  })
})
