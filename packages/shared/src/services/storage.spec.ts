import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createHistoryOperations,
  createStatsOperations,
  incrementDailyGames,
  loadJSON,
  loadSessionJSON,
  saveJSON,
  saveSessionJSON,
  selectCardsByFocus
} from './storage'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

// ============================================================================
// loadJSON
// ============================================================================

describe('loadJSON', () => {
  it('returns fallback when key is missing', () => {
    expect(loadJSON('missing-key', 42)).toBe(42)
  })

  it('returns fallback when stored value is invalid JSON', () => {
    localStorage.setItem('bad-json', '{not valid json}')
    expect(loadJSON('bad-json', 'fallback')).toBe('fallback')
  })

  it('returns parsed value when key exists with valid JSON', () => {
    localStorage.setItem('num', '99')
    expect(loadJSON('num', 0)).toBe(99)
  })
})

// ============================================================================
// saveJSON / loadJSON round-trip
// ============================================================================

describe('saveJSON / loadJSON round-trip', () => {
  it('preserves object shape', () => {
    const obj = { a: 1, b: 'hello', c: true }
    saveJSON('obj', obj)
    expect(loadJSON('obj', null)).toEqual(obj)
  })

  it('preserves nested objects', () => {
    const nested = { x: { y: [1, 2, 3] } }
    saveJSON('nested', nested)
    expect(loadJSON('nested', null)).toEqual(nested)
  })

  it('preserves arrays', () => {
    const arr = [1, 'two', { three: 3 }]
    saveJSON('arr', arr)
    expect(loadJSON('arr', null)).toEqual(arr)
  })
})

// ============================================================================
// incrementDailyGames
// ============================================================================

describe('incrementDailyGames', () => {
  it('returns isFirstGame=true on first call today', () => {
    const result = incrementDailyGames('daily-test')
    expect(result.isFirstGame).toBe(true)
    expect(result.gamesPlayedToday).toBe(1)
  })

  it('returns isFirstGame=false on second call same day', () => {
    incrementDailyGames('daily-test')
    const result = incrementDailyGames('daily-test')
    expect(result.isFirstGame).toBe(false)
    expect(result.gamesPlayedToday).toBe(2)
  })

  it('resets counter when date changes', () => {
    // Simulate a stored entry from yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    saveJSON('daily-test', { date: yesterdayStr, gamesPlayed: 5 })

    const result = incrementDailyGames('daily-test')
    expect(result.isFirstGame).toBe(true)
    expect(result.gamesPlayedToday).toBe(1)
  })

  it('increments gamesPlayedToday across multiple calls', () => {
    for (let i = 1; i <= 4; i++) {
      const result = incrementDailyGames('daily-test')
      expect(result.gamesPlayedToday).toBe(i)
    }
  })
})

// ============================================================================
// loadSessionJSON / saveSessionJSON round-trip
// ============================================================================

describe('loadSessionJSON / saveSessionJSON round-trip', () => {
  it('returns fallback when key is missing', () => {
    expect(loadSessionJSON('missing', 'default')).toBe('default')
  })

  it('returns fallback when stored value is invalid JSON', () => {
    sessionStorage.setItem('bad', 'not-json')
    expect(loadSessionJSON('bad', null)).toBeNull()
  })

  it('preserves object shape', () => {
    const data = { score: 10, name: 'test' }
    saveSessionJSON('session-obj', data)
    expect(loadSessionJSON('session-obj', null)).toEqual(data)
  })

  it('preserves arrays', () => {
    const arr = ['a', 'b', 'c']
    saveSessionJSON('session-arr', arr)
    expect(loadSessionJSON('session-arr', null)).toEqual(arr)
  })
})

// ============================================================================
// createHistoryOperations
// ============================================================================

describe('createHistoryOperations', () => {
  interface HistoryEntry {
    date: string
    points: number
  }

  it('load returns empty array when nothing stored', () => {
    const ops = createHistoryOperations<HistoryEntry>('history-test')
    expect(ops.load()).toEqual([])
  })

  it('add appends entry to existing array', () => {
    const ops = createHistoryOperations<HistoryEntry>('history-test')
    ops.add({ date: '2024-01-01', points: 10 })
    ops.add({ date: '2024-01-02', points: 20 })
    const all = ops.load()
    expect(all).toHaveLength(2)
    expect(all[0]!).toEqual({ date: '2024-01-01', points: 10 })
    expect(all[1]!).toEqual({ date: '2024-01-02', points: 20 })
  })

  it('save overwrites existing history', () => {
    const ops = createHistoryOperations<HistoryEntry>('history-test')
    ops.add({ date: '2024-01-01', points: 10 })
    ops.save([{ date: '2024-02-01', points: 99 }])
    expect(ops.load()).toEqual([{ date: '2024-02-01', points: 99 }])
  })
})

// ============================================================================
// createStatsOperations
// ============================================================================

describe('createStatsOperations', () => {
  interface Stats {
    gamesPlayed: number
    points: number
    correctAnswers: number
  }

  // Factory to avoid mutation of shared default object across tests
  const makeDefault = (): Stats => ({ gamesPlayed: 0, points: 0, correctAnswers: 0 })

  it('load returns defaultStats when nothing stored', () => {
    const ops = createStatsOperations<Stats>('stats-test', makeDefault())
    expect(ops.load()).toEqual(makeDefault())
  })

  it('update increments gamesPlayed by 1', () => {
    const ops = createStatsOperations<Stats>('stats-test', makeDefault())
    const result = ops.update(10, 5)
    expect(result.gamesPlayed).toBe(1)
  })

  it('update increments points by given amount', () => {
    const ops = createStatsOperations<Stats>('stats-test', makeDefault())
    const result = ops.update(15, 3)
    expect(result.points).toBe(15)
  })

  it('update increments correctAnswers by given amount', () => {
    const ops = createStatsOperations<Stats>('stats-test', makeDefault())
    const result = ops.update(10, 7)
    expect(result.correctAnswers).toBe(7)
  })

  it('update accumulates across multiple calls', () => {
    const ops = createStatsOperations<Stats>('stats-test', makeDefault())
    ops.update(10, 5)
    const result = ops.update(20, 3)
    expect(result.gamesPlayed).toBe(2)
    expect(result.points).toBe(30)
    expect(result.correctAnswers).toBe(8)
  })
})

// ============================================================================
// selectCardsByFocus
// ============================================================================

describe('selectCardsByFocus', () => {
  interface TestCard {
    level: number
    time: number
    id: number
  }

  const makeCards = (count: number): TestCard[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      level: (i % 5) + 1,
      time: 10 + i
    }))

  it('returns empty array when no eligible cards', () => {
    const result = selectCardsByFocus<TestCard>({
      cards: [],
      focus: 'weak',
      maxCards: 5
    })
    expect(result).toEqual([])
  })

  it('never returns more cards than maxCards', () => {
    const cards = makeCards(20)
    const result = selectCardsByFocus({ cards, focus: 'medium', maxCards: 5 })
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('never returns more cards than available', () => {
    const cards = makeCards(3)
    const result = selectCardsByFocus({ cards, focus: 'strong', maxCards: 10 })
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('focus=slow sorts by time descending', () => {
    const cards: TestCard[] = [
      { id: 1, level: 1, time: 5 },
      { id: 2, level: 2, time: 30 },
      { id: 3, level: 3, time: 15 }
    ]
    const result = selectCardsByFocus({
      cards,
      focus: 'slow',
      maxCards: 3,
      timeExtractor: c => c.time
    })
    expect(result[0]!.time).toBe(30)
    expect(result[1]!.time).toBe(15)
    expect(result[2]!.time).toBe(5)
  })

  it('applies modeFilter to exclude cards', () => {
    const cards = makeCards(10)
    const result = selectCardsByFocus({
      cards,
      focus: 'weak',
      maxCards: 10,
      modeFilter: c => c.level === 1
    })
    for (const card of result) {
      expect(card.level).toBe(1)
    }
  })

  it('returns empty array when modeFilter excludes all cards', () => {
    const cards = makeCards(10)
    const result = selectCardsByFocus({
      cards,
      focus: 'weak',
      maxCards: 10,
      modeFilter: () => false
    })
    expect(result).toEqual([])
  })

  it('focus=weak, focus=strong, focus=medium all return valid cards', () => {
    const cards = makeCards(20)
    for (const focus of ['weak', 'strong', 'medium'] as const) {
      const result = selectCardsByFocus({ cards, focus, maxCards: 10 })
      expect(result.length).toBeGreaterThan(0)
      for (const card of result) {
        expect(card.level).toBeGreaterThanOrEqual(1)
        expect(card.level).toBeLessThanOrEqual(5)
      }
    }
  })
})

// ============================================================================
// Property-Based Tests
// Validates: Requirements 7.5, 11.1, 11.2, 11.3
// ============================================================================

describe('saveJSON / loadJSON — property tests', () => {
  it('round-trip preserves arbitrary serializable objects', () => {
    // JSON.stringify(-0) === "0", so compare against JSON-serialized form (the actual contract)
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.jsonValue(), (key, value) => {
        localStorage.clear()
        saveJSON(key, value)
        const loaded = loadJSON(key, null)
        // The contract: round-trip matches what JSON serialization produces
        expect(loaded).toEqual(JSON.parse(JSON.stringify(value)))
      })
    )
  })

  // Validates: Requirements 11.1
  it('round-trip preserves BaseCard objects (level and time fields)', () => {
    fc.assert(
      fc.property(
        fc.record({
          level: fc.integer({ min: 1, max: 5 }),
          // time is stored as a number (tenths of a second, 1–600 → 0.1–60s)
          time: fc.integer({ min: 1, max: 600 }).map(n => n / 10)
        }),
        card => {
          localStorage.clear()
          saveJSON('card', card)
          const loaded = loadJSON<typeof card>('card', { level: 0, time: 0 })
          expect(loaded.level).toBe(card.level)
          expect(loaded.time).toBe(card.time)
        }
      )
    )
  })

  // Validates: Requirements 11.2
  it('round-trip preserves GameStats objects (all three stat fields)', () => {
    fc.assert(
      fc.property(
        fc.record({
          gamesPlayed: fc.integer({ min: 0, max: 1000 }),
          points: fc.integer({ min: 0, max: 100000 }),
          correctAnswers: fc.integer({ min: 0, max: 10000 })
        }),
        stats => {
          localStorage.clear()
          saveJSON('stats', stats)
          const loaded = loadJSON<typeof stats>('stats', {
            gamesPlayed: -1,
            points: -1,
            correctAnswers: -1
          })
          expect(loaded.gamesPlayed).toBe(stats.gamesPlayed)
          expect(loaded.points).toBe(stats.points)
          expect(loaded.correctAnswers).toBe(stats.correctAnswers)
        }
      )
    )
  })

  // Validates: Requirements 11.3
  it('round-trip preserves game history arrays (date, points, correctAnswers)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.string({ minLength: 10, maxLength: 10 }),
            points: fc.integer({ min: 0, max: 10000 }),
            correctAnswers: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        history => {
          localStorage.clear()
          saveJSON('history', history)
          const loaded = loadJSON<typeof history>('history', [])
          expect(loaded).toHaveLength(history.length)
          for (let i = 0; i < history.length; i++) {
            expect(loaded[i]!.date).toBe(history[i]!.date)
            expect(loaded[i]!.points).toBe(history[i]!.points)
            expect(loaded[i]!.correctAnswers).toBe(history[i]!.correctAnswers)
          }
        }
      )
    )
  })
})

// ============================================================================
// createGamePersistence
// ============================================================================

import {
  createGamePersistence,
  createGameResultOperations,
  createAppGameStorage,
  migrateStorageKeys
} from './storage'

describe('createGamePersistence', () => {
  it('saveSettings / loadSettings round-trip', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>(
      'gp-settings',
      'gp-state'
    )
    ops.saveSettings({ mode: 'copy' })
    expect(ops.loadSettings()).toEqual({ mode: 'copy' })
  })

  it('loadSettings returns null when key missing', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>(
      'gp-settings2',
      'gp-state2'
    )
    expect(ops.loadSettings()).toBeNull()
  })

  it('loadSettings returns null for invalid JSON', () => {
    sessionStorage.setItem('gp-settings3', 'not-json')
    const ops = createGamePersistence<{ mode: string }, { index: number }>(
      'gp-settings3',
      'gp-state3'
    )
    expect(ops.loadSettings()).toBeNull()
  })

  it('saveState / loadState round-trip', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s4', 'gp-state4')
    ops.saveState({ index: 3 })
    expect(ops.loadState()).toEqual({ index: 3 })
  })

  it('loadState returns null when key missing', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s5', 'gp-state5')
    expect(ops.loadState()).toBeNull()
  })

  it('loadState returns null for invalid JSON', () => {
    sessionStorage.setItem('gp-state6', 'bad')
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s6', 'gp-state6')
    expect(ops.loadState()).toBeNull()
  })

  it('clearSettings removes the key', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s7', 'gp-state7')
    ops.saveSettings({ mode: 'hidden' })
    ops.clearSettings()
    expect(ops.loadSettings()).toBeNull()
  })

  it('clearState removes the key', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s8', 'gp-state8')
    ops.saveState({ index: 5 })
    ops.clearState()
    expect(ops.loadState()).toBeNull()
  })

  it('clearAll removes both keys', () => {
    const ops = createGamePersistence<{ mode: string }, { index: number }>('gp-s9', 'gp-state9')
    ops.saveSettings({ mode: 'copy' })
    ops.saveState({ index: 1 })
    ops.clearAll()
    expect(ops.loadSettings()).toBeNull()
    expect(ops.loadState()).toBeNull()
  })
})

// ============================================================================
// createGameResultOperations
// ============================================================================

describe('createGameResultOperations', () => {
  it('save / load round-trip', () => {
    const ops = createGameResultOperations('result-test')
    ops.save({ points: 42, correctAnswers: 3, totalCards: 5 })
    expect(ops.load()).toEqual({ points: 42, correctAnswers: 3, totalCards: 5 })
  })

  it('load returns null when key missing', () => {
    const ops = createGameResultOperations('result-missing')
    expect(ops.load()).toBeNull()
  })

  it('clear removes the key', () => {
    const ops = createGameResultOperations('result-clear')
    ops.save({ points: 10, correctAnswers: 1, totalCards: 5 })
    ops.clear()
    expect(ops.load()).toBeNull()
  })
})

// ============================================================================
// createAppGameStorage
// ============================================================================

describe('createAppGameStorage', () => {
  it('setGameResult / getGameResult round-trip', () => {
    const ops = createAppGameStorage('ags-result', 'ags-state', 'ags-daily')
    ops.setGameResult({ points: 20, correctAnswers: 2, totalCards: 5 })
    expect(ops.getGameResult()).toEqual({ points: 20, correctAnswers: 2, totalCards: 5 })
  })

  it('clearGameResult removes result', () => {
    const ops = createAppGameStorage('ags-result2', 'ags-state2', 'ags-daily2')
    ops.setGameResult({ points: 5, correctAnswers: 1, totalCards: 3 })
    ops.clearGameResult()
    expect(ops.getGameResult()).toBeNull()
  })

  it('incrementDailyGames returns isFirstGame=true on first call', () => {
    const ops = createAppGameStorage('ags-result3', 'ags-state3', 'ags-daily3')
    const result = ops.incrementDailyGames()
    expect(result.isFirstGame).toBe(true)
    expect(result.gamesPlayedToday).toBe(1)
  })

  it('clearGameState removes game state key from sessionStorage', () => {
    sessionStorage.setItem('ags-state4', JSON.stringify({ index: 0 }))
    const ops = createAppGameStorage('ags-result4', 'ags-state4', 'ags-daily4')
    ops.clearGameState()
    expect(sessionStorage.getItem('ags-state4')).toBeNull()
  })
})

// ============================================================================
// migrateStorageKeys
// ============================================================================

describe('migrateStorageKeys', () => {
  it('migrates keys from old prefix to new prefix', () => {
    localStorage.setItem('old-cards', JSON.stringify([1, 2, 3]))
    localStorage.setItem('old-stats', JSON.stringify({ gamesPlayed: 5 }))
    localStorage.setItem('other-key', 'untouched')

    migrateStorageKeys('old-', 'new-')

    expect(localStorage.getItem('new-cards')).toBe(JSON.stringify([1, 2, 3]))
    expect(localStorage.getItem('new-stats')).toBe(JSON.stringify({ gamesPlayed: 5 }))
    expect(localStorage.getItem('old-cards')).toBeNull()
    expect(localStorage.getItem('old-stats')).toBeNull()
    expect(localStorage.getItem('other-key')).toBe('untouched')
  })

  it('does nothing when no keys match the old prefix', () => {
    localStorage.setItem('unrelated', 'value')
    migrateStorageKeys('nonexistent-', 'new-')
    expect(localStorage.getItem('unrelated')).toBe('value')
  })
})
