import { beforeEach, describe, expect, it } from 'vitest'

import { validateTypingAnswer, parseCardsFromText } from './helpers'

describe('validateTypingAnswer', () => {
  it('returns "correct" for exact match', () => {
    expect(validateTypingAnswer('Jahr', 'Jahr')).toBe('correct')
  })

  it('returns "correct" for exact match with leading/trailing spaces', () => {
    expect(validateTypingAnswer('  Jahr  ', 'Jahr')).toBe('correct')
  })

  it('returns "close" for distance-1 match (deletion)', () => {
    // 'Jah' is 1 deletion from 'Jahr'
    expect(validateTypingAnswer('Jah', 'Jahr')).toBe('close')
  })

  it('returns "close" for distance-1 match (insertion)', () => {
    // 'Jahrr' is 1 insertion from 'Jahr'
    expect(validateTypingAnswer('Jahrr', 'Jahr')).toBe('close')
  })

  it('returns "close" for distance-1 match (substitution)', () => {
    // 'Jbhr' is 1 substitution from 'Jahr'
    expect(validateTypingAnswer('Jbhr', 'Jahr')).toBe('close')
  })

  it('returns "incorrect" for distance > 1', () => {
    expect(validateTypingAnswer('xyz', 'Jahr')).toBe('incorrect')
  })

  it('returns "incorrect" for empty input', () => {
    expect(validateTypingAnswer('', 'Jahr')).toBe('incorrect')
  })

  it('returns "incorrect" for whitespace-only input', () => {
    expect(validateTypingAnswer('   ', 'Jahr')).toBe('incorrect')
  })

  it('is case-sensitive: "jahr" vs "Jahr" is distance 1 (substitution)', () => {
    // 'j' vs 'J' is 1 substitution → close
    expect(validateTypingAnswer('jahr', 'Jahr')).toBe('close')
  })

  it('returns "correct" for multi-word exact match', () => {
    expect(validateTypingAnswer('bleiben', 'bleiben')).toBe('correct')
  })
})

describe('parseCardsFromText', () => {
  beforeEach(() => {
    // No setup needed — pure function
  })

  // ─── Empty / null input ───────────────────────────────────────────────────

  it('returns null for empty string', () => {
    expect(parseCardsFromText('')).toBeNull()
  })

  // ─── Tab-delimited ────────────────────────────────────────────────────────

  it('parses tab-delimited input', () => {
    const text = 'Jahr\t1\nbleiben\t2'
    const result = parseCardsFromText(text)
    expect(result).not.toBeNull()
    expect(result?.cards).toHaveLength(2)
    expect(result!.cards[0]!.word).toBe('Jahr')
    expect(result!.cards[0]!.level).toBe(1)
    expect(result!.cards[1]!.word).toBe('bleiben')
    expect(result!.cards[1]!.level).toBe(2)
  })

  it('detects tab as delimiter', () => {
    const text = 'Jahr\t1\nbleiben\t2'
    const result = parseCardsFromText(text)
    expect(result?.delimiter).toBe('\t')
  })

  // ─── Semicolon-delimited ──────────────────────────────────────────────────

  it('parses semicolon-delimited input', () => {
    const text = 'Jahr;1\nbleiben;2'
    const result = parseCardsFromText(text)
    expect(result).not.toBeNull()
    expect(result?.cards).toHaveLength(2)
    expect(result!.cards[0]!.word).toBe('Jahr')
    expect(result?.delimiter).toBe(';')
  })

  // ─── Header skip ──────────────────────────────────────────────────────────

  it('skips header line containing "word" and "level"', () => {
    const text = 'word\tlevel\nJahr\t1\nbleiben\t2'
    const result = parseCardsFromText(text)
    expect(result?.cards).toHaveLength(2)
    expect(result!.cards[0]!.word).toBe('Jahr')
  })

  it('does not skip first line if it does not contain "word" and "level"', () => {
    const text = 'Jahr\t1\nbleiben\t2'
    const result = parseCardsFromText(text)
    expect(result?.cards).toHaveLength(2)
  })

  // ─── Newline-only words ───────────────────────────────────────────────────

  it('parses newline-only separated words (no delimiter)', () => {
    const text = 'Jahr\nbleiben\nJanuar'
    const result = parseCardsFromText(text)
    expect(result).not.toBeNull()
    expect(result?.cards).toHaveLength(3)
    expect(result!.cards[0]!.word).toBe('Jahr')
    expect(result!.cards[0]!.level).toBe(1) // MIN_LEVEL
    expect(result?.delimiter).toBe('\n')
  })

  it('newline-only cards get MIN_LEVEL', () => {
    const text = 'Jahr\nbleiben'
    const result = parseCardsFromText(text)
    for (const card of result?.cards ?? []) {
      expect(card.level).toBe(1)
    }
  })

  // ─── Invalid level ────────────────────────────────────────────────────────

  it('defaults to MIN_LEVEL for invalid level string', () => {
    const text = 'Jahr\tabc'
    const result = parseCardsFromText(text)
    expect(result!.cards[0]!.level).toBe(1)
  })

  it('defaults to MIN_LEVEL for level out of range (0)', () => {
    const text = 'Jahr\t0'
    const result = parseCardsFromText(text)
    expect(result!.cards[0]!.level).toBe(1)
  })

  it('defaults to MIN_LEVEL for level out of range (6)', () => {
    const text = 'Jahr\t6'
    const result = parseCardsFromText(text)
    expect(result!.cards[0]!.level).toBe(1)
  })

  it('accepts valid level 5', () => {
    const text = 'Jahr\t5'
    const result = parseCardsFromText(text)
    expect(result!.cards[0]!.level).toBe(5)
  })

  // ─── MAX_TIME default ─────────────────────────────────────────────────────

  it('sets time to MAX_TIME for all parsed cards', () => {
    const text = 'Jahr\t1\nbleiben\t2'
    const result = parseCardsFromText(text)
    for (const card of result?.cards ?? []) {
      expect(card.time).toBeGreaterThan(0)
    }
  })
})
