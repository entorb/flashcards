import type { FocusType } from '@flashcards/shared'
import { createGameStoreFactory } from '@flashcards/shared'

import { GAME_STATE_FLOW_CONFIG, MAX_CARDS_PER_GAME } from '@/constants'
import {
  filterCardsAll,
  filterCardsBySelection,
  filterCardsSquares,
  selectCardsForRound
} from '@/services/cardSelector'
import {
  getVirtualCardsForRange,
  initializeCards,
  parseCardQuestion,
  clearGameState as storageClearGameState,
  getGameConfig as storageGetGameConfig,
  loadCards as storageLoadCards,
  loadGameState as storageLoadGameState,
  loadGameStats as storageLoadGameStats,
  loadHistory as storageLoadHistory,
  loadRange as storageLoadRange,
  resetCards as storageResetCards,
  saveGameState as storageSaveGameState,
  saveGameStats as storageSaveGameStats,
  saveHistory as storageSaveHistory,
  setGameConfig as storageSetGameConfig,
  setGameResult as storageSetGameResult,
  updateCard as storageUpdateCard
} from '@/services/storage'
import type { Card, GameHistory, GameSettings } from '@/types'

export const useGameStore = createGameStoreFactory<Card, GameHistory, GameSettings>({
  storage: {
    loadCards: (...args) => storageLoadCards(...args),
    loadHistory: (...args) => storageLoadHistory(...args),
    saveHistory: (...args) => {
      storageSaveHistory(...args)
    },
    loadGameStats: (...args) => storageLoadGameStats(...args),
    saveGameStats: (...args) => {
      storageSaveGameStats(...args)
    },
    getGameConfig: (...args) => storageGetGameConfig(...args),
    setGameConfig: (...args) => {
      storageSetGameConfig(...args)
    },
    loadRange: (...args) => storageLoadRange(...args),
    getVirtualCardsForRange: (...args) => getVirtualCardsForRange(...args),
    initializeCards: (...args) => initializeCards(...args),
    saveGameState: (...args) => {
      storageSaveGameState(...args)
    },
    loadGameState: (...args) => storageLoadGameState(...args),
    clearGameState: (...args) => {
      storageClearGameState(...args)
    },
    setGameResult: (...args) => {
      storageSetGameResult(...args)
    },
    updateCard: (...args) => {
      storageUpdateCard(...args)
    },
    resetCards: (...args) => {
      storageResetCards(...args)
    }
  },
  filterCards: (allCards, settings, range) => {
    const rangeSet = new Set(range)
    if (settings.select === 'x²') {
      return filterCardsSquares(allCards, rangeSet)
    }
    if (settings.select === 'all') {
      return filterCardsAll(allCards, rangeSet)
    }
    const selectArray = Array.isArray(settings.select) ? settings.select : []
    return filterCardsBySelection(allCards, selectArray, rangeSet)
  },
  getDifficultyPoints: card => {
    const { x, y } = parseCardQuestion(card.question)
    return Math.min(x, y)
  },
  selectCardsForRound: (cards, focus, count) =>
    selectCardsForRound(cards, focus as FocusType, count),
  buildHistorySettings: (settings, range) => {
    const settingsForHistory = { ...settings }
    const rangeSet = new Set(range)
    if (
      Array.isArray(settings.select) &&
      settings.select.length === range.length &&
      settings.select.every(num => rangeSet.has(num))
    ) {
      settingsForHistory.select = 'all'
    }
    return settingsForHistory
  },
  gameStateFlowConfig: GAME_STATE_FLOW_CONFIG,
  maxCardsPerGame: MAX_CARDS_PER_GAME
})
