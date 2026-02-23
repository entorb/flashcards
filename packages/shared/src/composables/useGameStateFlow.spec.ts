import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearGameSessionData,
  getGameCards,
  getLastGameSettings,
  initializeGameFlow,
  removeCardFromGame,
  transferGameResultsWithBonuses,
  updateGameStats
} from './useGameStateFlow'
import type { GameStateFlowConfig } from './useGameStateFlow'

interface TestCard {
  id: number
  word: string
  level: number
}

interface TestSettings {
  focus: string
  maxCards: number
  deck: string
}

const config: GameStateFlowConfig = {
  settingsKey: 'test-settings',
  selectedCardsKey: 'test-selected-cards',
  gameResultKey: 'test-game-result',
  historyKey: 'test-history',
  statsKey: 'test-stats',
  dailyStatsKey: 'test-daily-stats'
}

const sampleCards: TestCard[] = [
  { id: 1, word: 'Haus', level: 1 },
  { id: 2, word: 'Baum', level: 2 },
  { id: 3, word: 'Auto', level: 3 }
]

const sampleSettings: TestSettings = {
  focus: 'medium',
  maxCards: 10,
  deck: 'LWK_1'
}

describe('useGameStateFlow', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('initializeGameFlow', () => {
    it('saves settings to localStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      const stored = localStorage.getItem(config.settingsKey)
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toEqual(sampleSettings)
    })

    it('saves selected cards to sessionStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      const stored = sessionStorage.getItem(config.selectedCardsKey)
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toEqual(sampleCards)
    })

    it('overwrites previous settings on repeated calls', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      const updatedSettings: TestSettings = { focus: 'weak', maxCards: 5, deck: 'LWK_2' }
      initializeGameFlow(config, updatedSettings, [])
      const stored = localStorage.getItem(config.settingsKey)
      expect(JSON.parse(stored!)).toEqual(updatedSettings)
    })
  })

  describe('getGameCards', () => {
    it('returns cards stored in sessionStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      const cards = getGameCards<TestCard>(config)
      expect(cards).toEqual(sampleCards)
    })

    it('returns empty array when sessionStorage key is missing', () => {
      const cards = getGameCards<TestCard>(config)
      expect(cards).toEqual([])
    })
  })

  describe('removeCardFromGame', () => {
    it('removes card at given index', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      removeCardFromGame<TestCard>(config, 1)
      const remaining = getGameCards<TestCard>(config)
      expect(remaining).toHaveLength(2)
      expect(remaining[0]!.word).toBe('Haus')
      expect(remaining[1]!.word).toBe('Auto')
    })

    it('removes first card (index 0)', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      removeCardFromGame<TestCard>(config, 0)
      const remaining = getGameCards<TestCard>(config)
      expect(remaining).toHaveLength(2)
      expect(remaining[0]!.word).toBe('Baum')
    })

    it('removes last card', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      removeCardFromGame<TestCard>(config, 2)
      const remaining = getGameCards<TestCard>(config)
      expect(remaining).toHaveLength(2)
      expect(remaining[1]!.word).toBe('Baum')
    })

    it('throws on negative index', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      expect(() => {
        removeCardFromGame<TestCard>(config, -1)
      }).toThrow()
    })

    it('throws on index equal to array length', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      expect(() => {
        removeCardFromGame<TestCard>(config, 3)
      }).toThrow()
    })

    it('throws on index greater than array length', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      expect(() => {
        removeCardFromGame<TestCard>(config, 99)
      }).toThrow()
    })
  })

  describe('updateGameStats', () => {
    it('saves game result to sessionStorage', () => {
      updateGameStats(config, 42, 3, 5)
      const stored = sessionStorage.getItem(config.gameResultKey)
      expect(stored).not.toBeNull()
      const result = JSON.parse(stored!)
      expect(result).toEqual({ points: 42, correctAnswers: 3, totalCards: 5 })
    })

    it('overwrites previous result on repeated calls', () => {
      updateGameStats(config, 10, 1, 5)
      updateGameStats(config, 80, 4, 5)
      const stored = sessionStorage.getItem(config.gameResultKey)
      const result = JSON.parse(stored!)
      expect(result.points).toBe(80)
      expect(result.correctAnswers).toBe(4)
    })

    it('saves zero values correctly', () => {
      updateGameStats(config, 0, 0, 0)
      const stored = sessionStorage.getItem(config.gameResultKey)
      const result = JSON.parse(stored!)
      expect(result).toEqual({ points: 0, correctAnswers: 0, totalCards: 0 })
    })
  })

  describe('clearGameSessionData', () => {
    it('removes selected cards key from sessionStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      updateGameStats(config, 10, 2, 3)
      clearGameSessionData(config)
      expect(sessionStorage.getItem(config.selectedCardsKey)).toBeNull()
    })

    it('removes game result key from sessionStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      updateGameStats(config, 10, 2, 3)
      clearGameSessionData(config)
      expect(sessionStorage.getItem(config.gameResultKey)).toBeNull()
    })

    it('does not affect localStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      clearGameSessionData(config)
      expect(localStorage.getItem(config.settingsKey)).not.toBeNull()
    })

    it('is safe to call when keys are already absent', () => {
      expect(() => {
        clearGameSessionData(config)
      }).not.toThrow()
    })
  })

  describe('getLastGameSettings', () => {
    it('returns stored settings from localStorage', () => {
      initializeGameFlow(config, sampleSettings, sampleCards)
      const result = getLastGameSettings<TestSettings>(config, {
        focus: 'strong',
        maxCards: 20,
        deck: 'default'
      })
      expect(result).toEqual(sampleSettings)
    })

    it('returns fallback when key is missing', () => {
      const fallback: TestSettings = { focus: 'strong', maxCards: 20, deck: 'default' }
      const result = getLastGameSettings<TestSettings>(config, fallback)
      expect(result).toEqual(fallback)
    })

    it('returns fallback when localStorage is empty', () => {
      const fallback: TestSettings = { focus: 'weak', maxCards: 5, deck: 'LWK_1' }
      const result = getLastGameSettings<TestSettings>(config, fallback)
      expect(result).toBe(fallback)
    })
  })
})

// ============================================================================
// transferGameResultsWithBonuses
// ============================================================================

interface TestHistory {
  date: string
  points: number
  correctAnswers: number
  totalCards: number
}

const bonusConfig = {
  firstGameBonus: 5,
  streakGameBonus: 5,
  streakGameInterval: 5
}

const transferConfig: GameStateFlowConfig = {
  settingsKey: 'tr-settings',
  selectedCardsKey: 'tr-selected',
  gameResultKey: 'tr-result',
  historyKey: 'tr-history',
  statsKey: 'tr-stats',
  dailyStatsKey: 'tr-daily'
}

describe('transferGameResultsWithBonuses', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('throws when no game result in sessionStorage', () => {
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-01', points: 0, correctAnswers: 0, totalCards: 5 }
    expect(() =>
      transferGameResultsWithBonuses(transferConfig, bonusConfig, entry, saveHistory, saveStats)
    ).toThrow('No game result found')
  })

  it('returns firstGame bonus on first game of the day', () => {
    updateGameStats(transferConfig, 10, 3, 5)
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-01', points: 0, correctAnswers: 3, totalCards: 5 }

    const result = transferGameResultsWithBonuses(
      transferConfig,
      bonusConfig,
      entry,
      saveHistory,
      saveStats
    )

    expect(result.dailyInfo.isFirstGame).toBe(true)
    expect(result.bonusPoints).toBe(5)
    expect(result.totalPoints).toBe(15) // 10 + 5 bonus
  })

  it('returns streak bonus on Nth game', () => {
    // Pre-fill daily stats so next game is the 5th
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(
      transferConfig.dailyStatsKey,
      JSON.stringify({ date: today, gamesPlayed: 4 })
    )

    updateGameStats(transferConfig, 20, 4, 5)
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-01', points: 0, correctAnswers: 4, totalCards: 5 }

    const result = transferGameResultsWithBonuses(
      transferConfig,
      bonusConfig,
      entry,
      saveHistory,
      saveStats
    )

    expect(result.dailyInfo.gamesPlayedToday).toBe(5)
    expect(result.bonusPoints).toBe(5) // streak bonus
    expect(result.totalPoints).toBe(25) // 20 + 5
  })

  it('calls saveHistory and saveStats with updated data', () => {
    updateGameStats(transferConfig, 30, 5, 5)
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-02', points: 0, correctAnswers: 5, totalCards: 5 }

    transferGameResultsWithBonuses(transferConfig, bonusConfig, entry, saveHistory, saveStats)

    expect(saveHistory).toHaveBeenCalledOnce()
    expect(saveStats).toHaveBeenCalledOnce()

    const historyArg = saveHistory.mock.calls[0]![0] as TestHistory[]
    expect(historyArg).toHaveLength(1)
    expect(historyArg[0]!.correctAnswers).toBe(5)

    const statsArg = saveStats.mock.calls[0]![0] as {
      gamesPlayed: number
      points: number
      correctAnswers: number
    }
    expect(statsArg.gamesPlayed).toBe(1)
    expect(statsArg.correctAnswers).toBe(5)
  })

  it('appends to existing history', () => {
    // Pre-fill history
    localStorage.setItem(
      transferConfig.historyKey,
      JSON.stringify([{ date: '2024-01-01', points: 10, correctAnswers: 2, totalCards: 5 }])
    )
    updateGameStats(transferConfig, 15, 3, 5)
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-02', points: 0, correctAnswers: 3, totalCards: 5 }

    transferGameResultsWithBonuses(transferConfig, bonusConfig, entry, saveHistory, saveStats)

    const historyArg = saveHistory.mock.calls[0]![0] as TestHistory[]
    expect(historyArg).toHaveLength(2)
  })

  it('mutates historyEntry.points to include bonus', () => {
    updateGameStats(transferConfig, 10, 2, 5)
    const saveHistory = vi.fn()
    const saveStats = vi.fn()
    const entry: TestHistory = { date: '2024-01-01', points: 0, correctAnswers: 2, totalCards: 5 }

    transferGameResultsWithBonuses(transferConfig, bonusConfig, entry, saveHistory, saveStats)

    // entry.points should be mutated to include bonus (first game = +5)
    expect(entry.points).toBe(15)
  })
})
