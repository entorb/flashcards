/**
 * Game Store Factory
 * Generates the full game store composable shared between 1x1 and div apps.
 * Each app provides app-specific callbacks for filtering, scoring, and history.
 */

import { computed, ref } from 'vue'

import { LOOP_COUNT, MAX_LEVEL, MAX_TIME, MIN_LEVEL, MIN_TIME } from '../constants'
import { calculatePointsBreakdown } from '../services/scoring'
import type {
  AnswerStatus,
  BaseCard,
  BaseGameHistory,
  GameResult,
  GameStats,
  SessionMode
} from '../types'
import { shuffleArray } from '../utils/cardSelection'
import {
  filterBelowMaxLevel,
  filterLevel1Cards,
  handleNextCard,
  isEndlessMode,
  repeatCards
} from '../utils/gameModeUtils'
import { roundTime } from '../utils/helper'

import { createBaseGameStore } from './useBaseGameStore'
import type { GameStateFlowConfig } from './useGameStateFlow'
import { initializeGameFlow } from './useGameStateFlow'

export interface GameStoreFactoryConfig<
  TCard extends BaseCard & { question: string; answer: number },
  THistory extends BaseGameHistory,
  TSettings
> {
  storage: {
    loadCards: () => TCard[]
    loadHistory: () => THistory[]
    saveHistory: (h: THistory[]) => void
    loadGameStats: () => GameStats
    saveGameStats: (s: GameStats) => void
    getGameConfig: () => TSettings | null
    setGameConfig: (c: TSettings) => void
    loadRange: () => number[]
    getVirtualCardsForRange: (range: number[]) => TCard[]
    initializeCards: () => TCard[]
    saveGameState: (state: {
      gameCards: TCard[]
      currentCardIndex: number
      points: number
      correctAnswersCount: number
      sessionMode: SessionMode
      initialCardCount: number
    }) => void
    loadGameState: () => {
      gameCards: TCard[]
      currentCardIndex: number
      points: number
      correctAnswersCount: number
      sessionMode?: SessionMode
      initialCardCount?: number
    } | null
    clearGameState: () => void
    setGameResult: (result: GameResult) => void
    updateCard: (question: string, updates: Partial<TCard>) => void
    resetCards: () => void
  }
  filterCards: (allCards: TCard[], settings: TSettings, range: number[]) => TCard[]
  getDifficultyPoints: (card: TCard) => number
  selectCardsForRound: (cards: TCard[], focus: string, count: number) => TCard[]
  buildHistorySettings?: (settings: TSettings, range: number[]) => TSettings
  gameStateFlowConfig: GameStateFlowConfig
  maxCardsPerGame: number
}

/**
 * Select cards based on session mode (shared across all apps)
 */
function selectCardsByMode<TCard extends BaseCard, TSettings extends { focus: string }>(
  filteredCards: TCard[],
  mode: SessionMode,
  settings: TSettings,
  selectForRound: (cards: TCard[], focus: string, count: number) => TCard[],
  maxCards: number
): TCard[] {
  if (mode === 'endless-level1') {
    return shuffleArray(filterLevel1Cards(filteredCards))
  }
  if (mode === 'endless-level5') {
    return shuffleArray(filterBelowMaxLevel(filteredCards))
  }
  if (mode === '3-rounds') {
    const focusSelected = selectForRound(filteredCards, settings.focus, maxCards)
    return shuffleArray(repeatCards(focusSelected, LOOP_COUNT))
  }
  return shuffleArray(selectForRound(filteredCards, settings.focus, maxCards))
}

/**
 * Handle correct/close answer: update level up and time
 */
function handleCorrectAnswer<TCard extends BaseCard & { question: string }>(
  card: TCard,
  answerTime: number,
  updateCard: (question: string, updates: Partial<TCard>) => void
): void {
  const newLevel = Math.min(card.level + 1, MAX_LEVEL)
  const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
  card.level = newLevel
  card.time = roundTime(clampedTime)
  updateCard(card.question, { level: newLevel, time: card.time } as Partial<TCard>)
}

/**
 * Handle incorrect answer: update level down
 */
function handleIncorrectAnswer<TCard extends BaseCard & { question: string }>(
  card: TCard,
  updateCard: (question: string, updates: Partial<TCard>) => void
): void {
  const newLevel = Math.max(card.level - 1, MIN_LEVEL)
  card.level = newLevel
  updateCard(card.question, { level: newLevel } as Partial<TCard>)
}

/**
 * Create a game store composable from app-specific config.
 * Returns a function that, when called, returns the full store API.
 */
export function createGameStoreFactory<
  TCard extends BaseCard & { question: string; answer: number },
  THistory extends BaseGameHistory,
  TSettings extends { focus: string }
>(factoryConfig: GameStoreFactoryConfig<TCard, THistory, TSettings>) {
  const { storage, gameStateFlowConfig, maxCardsPerGame } = factoryConfig

  // Create base store with shared state and logic
  const baseStore = createBaseGameStore<TCard, THistory, TSettings>({
    loadCards: storage.loadCards,
    loadHistory: storage.loadHistory,
    saveHistory: storage.saveHistory,
    loadGameStats: storage.loadGameStats,
    saveGameStats: storage.saveGameStats
  })

  return function useGameStore() {
    // Initialize store on first use
    baseStore.initializeStore()

    // Load game config from storage
    const savedConfig = storage.getGameConfig()
    if (savedConfig && !baseStore.gameSettings.value) {
      baseStore.gameSettings.value = savedConfig
    }

    // Track initial card count for endless mode (where gameCards shrinks)
    const initialCardCount = ref(0)

    // Restore game state if page was reloaded during a game
    const savedGameState = storage.loadGameState()
    if (savedGameState && savedGameState.gameCards.length > 0) {
      baseStore.gameCards.value = savedGameState.gameCards
      baseStore.currentCardIndex.value = savedGameState.currentCardIndex
      baseStore.points.value = savedGameState.points
      baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
      baseStore.sessionMode.value = savedGameState.sessionMode ?? 'standard'
      initialCardCount.value = savedGameState.initialCardCount ?? savedGameState.gameCards.length
    }

    function saveCurrentGameState() {
      storage.saveGameState({
        gameCards: baseStore.gameCards.value,
        currentCardIndex: baseStore.currentCardIndex.value,
        points: baseStore.points.value,
        correctAnswersCount: baseStore.correctAnswersCount.value,
        sessionMode: baseStore.sessionMode.value,
        initialCardCount: initialCardCount.value
      })
    }

    function startGame(settings: TSettings, mode: SessionMode = 'standard', forceReset = false) {
      if (!forceReset && baseStore.gameCards.value.length > 0) {
        return
      }

      const existingCards = storage.loadCards()
      if (existingCards.length === 0) {
        storage.initializeCards()
      }

      storage.setGameConfig(settings)
      baseStore.gameSettings.value = settings
      baseStore.resetGameState()
      baseStore.sessionMode.value = mode

      const range = storage.loadRange()
      const allAvailableCards = storage.getVirtualCardsForRange(range)
      const filteredCards = factoryConfig.filterCards(allAvailableCards, settings, range)
      const selectedCards = selectCardsByMode(
        filteredCards,
        mode,
        settings,
        factoryConfig.selectCardsForRound,
        maxCardsPerGame
      )

      initializeGameFlow(gameStateFlowConfig, settings, selectedCards)
      baseStore.gameCards.value = selectedCards
      initialCardCount.value = selectedCards.length

      storage.saveGameState({
        gameCards: baseStore.gameCards.value,
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0,
        sessionMode: mode,
        initialCardCount: selectedCards.length
      })
    }

    function handleAnswer(result: AnswerStatus, answerTime: number) {
      const card = currentCard.value
      if (!(card && baseStore.gameSettings.value)) return

      if (result === 'correct' || result === 'close') {
        const rawDifficulty = factoryConfig.getDifficultyPoints(card)
        const difficultyPoints = result === 'correct' ? rawDifficulty : 0

        const pointsBreakdown = calculatePointsBreakdown({
          difficultyPoints,
          level: card.level,
          timeBonus: card.time < MAX_TIME && answerTime <= card.time,
          closeAdjustment: result === 'close'
        })

        baseStore.handleAnswerBase(result, pointsBreakdown)
        handleCorrectAnswer(card, answerTime, storage.updateCard)
      } else {
        handleIncorrectAnswer(card, storage.updateCard)
      }

      saveCurrentGameState()
    }

    const baseNextCard = baseStore.nextCard
    function nextCard() {
      const isGameOver = handleNextCard(
        baseStore.gameCards,
        baseStore.currentCardIndex,
        baseStore.sessionMode.value,
        baseNextCard,
        (c: TCard) => c.question
      )

      if (!isGameOver) {
        saveCurrentGameState()
      }
      return isGameOver
    }

    function finishGame() {
      if (!baseStore.gameSettings.value) return

      const settingsForHistory = factoryConfig.buildHistorySettings
        ? factoryConfig.buildHistorySettings(baseStore.gameSettings.value, storage.loadRange())
        : { ...baseStore.gameSettings.value }

      const historyEntry: THistory = {
        date: new Date().toISOString(),
        settings: settingsForHistory,
        points: baseStore.points.value,
        correctAnswers: baseStore.correctAnswersCount.value
      } as unknown as THistory

      baseStore.history.value = [...baseStore.history.value, historyEntry]
      baseStore.gameStats.value.gamesPlayed++

      const totalCards = isEndlessMode(baseStore.sessionMode.value)
        ? initialCardCount.value
        : baseStore.gameCards.value.length
      storage.setGameResult({
        points: baseStore.points.value,
        correctAnswers: baseStore.correctAnswersCount.value,
        totalCards
      })

      storage.clearGameState()
      baseStore.sessionMode.value = 'standard'
      baseStore.resetGameState()
    }

    function discardGame() {
      storage.clearGameState()
      baseStore.discardGame()
    }

    function resetCards() {
      storage.clearGameState()
      storage.resetCards()
      baseStore.allCards.value = storage.loadCards()
    }

    const currentCard = computed(() => {
      return baseStore.gameCards.value[baseStore.currentCardIndex.value] ?? null
    })

    return {
      allCards: baseStore.allCards,
      gameCards: baseStore.gameCards,
      gameSettings: baseStore.gameSettings,
      sessionMode: baseStore.sessionMode,
      currentCardIndex: baseStore.currentCardIndex,
      points: baseStore.points,
      correctAnswersCount: baseStore.correctAnswersCount,
      history: baseStore.history,
      gameStats: baseStore.gameStats,
      currentCard,
      lastPointsBreakdown: baseStore.lastPointsBreakdown,
      startGame,
      handleAnswer,
      nextCard,
      finishGame,
      discardGame,
      resetCards,
      moveAllCards: baseStore.moveAllCards
    }
  }
}
