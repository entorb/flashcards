import { describe, expect, it } from 'vitest'

import { formatDisplayQuestion } from './questionFormatter'

describe('pum formatDisplayQuestion — unit tests', () => {
  it('formats plus question with spaces', () => {
    expect(formatDisplayQuestion('7+3')).toBe('7 + 3')
  })

  it('formats minus question with spaces', () => {
    expect(formatDisplayQuestion('15-8')).toBe('15 - 8')
  })

  it('formats single-digit plus operands', () => {
    expect(formatDisplayQuestion('1+1')).toBe('1 + 1')
  })

  it('formats double-digit plus operands', () => {
    expect(formatDisplayQuestion('20+11')).toBe('20 + 11')
  })

  it('formats single-digit minus operands', () => {
    expect(formatDisplayQuestion('9-4')).toBe('9 - 4')
  })

  it('formats double-digit minus operands', () => {
    expect(formatDisplayQuestion('18-12')).toBe('18 - 12')
  })
})
