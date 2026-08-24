import { createDeckGameStore, MAX_TIME } from '@flashcards/shared'

import {
  DEFAULT_DECKS,
  GAME_STATE_FLOW_CONFIG,
  INITIAL_CARDS,
  POINTS_MODE_BLIND,
  POINTS_MODE_TYPING
} from '../constants'
import { selectCardsForRound } from '../services/cardSelector'
import {
  clearGameState,
  loadCards,
  loadDecks,
  loadGameState,
  loadGameStats,
  loadHistory,
  loadSettings,
  saveCards,
  saveDecks,
  saveGameState,
  saveGameStats,
  saveHistory,
  saveSettings,
  setGameResult
} from '../services/storage'
import type { Card, GameHistory, GameSettings } from '../types'

function getModePoints(mode: GameSettings['mode']): number {
  switch (mode) {
    case 'blind':
      return POINTS_MODE_BLIND
    case 'typing':
      return POINTS_MODE_TYPING
    case 'multiple-choice':
      return 1
    default: {
      const _exhaustive: never = mode
      console.error('Unexpected game mode:', _exhaustive)
      return 1
    }
  }
}

export const useGameStore = createDeckGameStore<Card, GameHistory, GameSettings>({
  storage: {
    loadCards,
    saveCards,
    loadHistory,
    saveHistory,
    loadGameStats,
    saveGameStats,
    loadDecks,
    saveDecks,
    loadSettings,
    saveSettings,
    loadGameState,
    saveGameState,
    clearGameState,
    setGameResult
  },
  gameStateFlowConfig: GAME_STATE_FLOW_CONFIG,
  getKey: card => card.voc,
  selectCards: (cards, settings) => selectCardsForRound(cards, settings.focus),
  getDifficultyPoints: settings => getModePoints(settings.mode),
  tracksTime: () => true,
  timeBonusPredicate: (card, answerTime, result) =>
    result === 'correct' &&
    answerTime !== undefined &&
    answerTime < MAX_TIME &&
    answerTime < card.time,
  getLanguageBonus: (result, settings) =>
    result === 'correct' && settings.language === 'de-voc' ? 1 : 0,
  isValidImportCard: card => card.voc.trim().length > 0 && card.de.trim().length > 0,
  newDeckCards: () => [...INITIAL_CARDS],
  getDefaultDeckName: () => DEFAULT_DECKS[0]?.name ?? '',
  resetCards: ({ setAllCards }) => {
    setAllCards(INITIAL_CARDS)
    saveCards(INITIAL_CARDS)
  }
})
