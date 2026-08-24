import { createDeckGameStore, MAX_TIME } from '@flashcards/shared'

import { DEFAULT_DECKS, GAME_STATE_FLOW_CONFIG, POINTS_MODE_HIDDEN } from '../constants'
import { selectCards } from '../services/cardSelector'
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
  getKey: card => card.word,
  selectCards: (cards, settings) => selectCards(cards, settings.mode, settings.focus),
  getDifficultyPoints: settings => (settings.mode === 'hidden' ? POINTS_MODE_HIDDEN : 1),
  tracksTime: settings => settings.mode === 'hidden',
  timeBonusPredicate: (card, answerTime, result, settings) =>
    result === 'correct' &&
    settings.mode === 'hidden' &&
    answerTime !== undefined &&
    card.time < MAX_TIME &&
    answerTime <= card.time,
  isValidImportCard: card => card.word.trim().length > 0,
  newDeckCards: () => [],
  getDefaultDeckName: () => DEFAULT_DECKS[0]?.name ?? '',
  resetCards: ({ setAllCards }) => {
    const defaultDeck = DEFAULT_DECKS[0]
    if (defaultDeck === undefined) return
    saveDecks([defaultDeck])
    setAllCards(defaultDeck.cards)
    const currentSettings = loadSettings()
    if (currentSettings) {
      currentSettings.deck = defaultDeck.name
      saveSettings(currentSettings)
    }
  }
})
