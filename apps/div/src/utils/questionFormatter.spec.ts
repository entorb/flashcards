import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { formatDisplayQuestion } from './questionFormatter'

describe('formatDisplayQuestion', () => {
  // Feature: div-app, Property 4: Question formatting preserves operands with spacing
  // **Validates: Requirements 4.1, 4.2**
  describe('Property 4: Question formatting preserves operands with spacing', () => {
    it('for any valid "Z:D", output is "Z : D" preserving order', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 81 }),
          fc.integer({ min: 2, max: 9 }),
          (dividend, divisor) => {
            const question = `${dividend}:${divisor}`
            const result = formatDisplayQuestion(question)
            expect(result).toBe(`${dividend} : ${divisor}`)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('unit tests', () => {
    it('formats a simple division question with spaced colon', () => {
      expect(formatDisplayQuestion('18:3')).toBe('18 : 3')
    })

    it('formats a two-digit dividend question', () => {
      expect(formatDisplayQuestion('72:9')).toBe('72 : 9')
    })

    it('formats a single-digit dividend question', () => {
      expect(formatDisplayQuestion('4:2')).toBe('4 : 2')
    })

    it('ignores the optional selection parameter', () => {
      expect(formatDisplayQuestion('18:3', [3])).toBe('18 : 3')
      expect(formatDisplayQuestion('18:3', [2, 3, 5])).toBe('18 : 3')
    })

    it('works without selection parameter', () => {
      expect(formatDisplayQuestion('56:7')).toBe('56 : 7')
    })

    it('handles selection as undefined', () => {
      expect(formatDisplayQuestion('42:6', undefined)).toBe('42 : 6')
    })
  })
})
