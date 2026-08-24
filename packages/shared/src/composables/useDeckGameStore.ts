/**
 * Deck Game Store Factory
 * Generates the full game store composable shared between voc and lwk apps.
 * Each app provides app-specific callbacks for card selection, scoring, and deck management.
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
  filterByLevels,
  filterLevel1Cards,
  handleNextCard,
  isEndlessMode,
  repeatCards
} from '../utils/gameModeUtils'
import { roundTime } from '../utils/helper'

import { createBaseGameStore } from './useBaseGameStore'
import { useDeckManagement } from './useDeckManagement'
import type { GameStateFlowConfig } from './useGameStateFlow'
import { initializeGameFlow } from './useGameStateFlow'

export interface SavedGameState<TCard, TSettings> {
  gameCards: TCard[]
  currentCardIndex: number
  points: number
  correctAnswersCount: number
  gameSettings: TSettings
  sessionMode?: SessionMode
  initialCardCount?: number
}

export interface DeckGameStoreConfig<
  TCard extends BaseCard,
  THistory extends BaseGameHistory,
  TSettings extends { focus: string; deck?: string; levels?: number[] }
> {
  storage: {
    loadCards: () => TCard[]
    saveCards: (cards: TCard[]) => void
    loadHistory: () => THistory[]
    saveHistory: (history: THistory[]) => void
    loadGameStats: () => GameStats
    saveGameStats: (stats: GameStats) => void
    loadDecks: () => Array<{ name: string; cards: TCard[] }>
    saveDecks: (decks: Array<{ name: string; cards: TCard[] }>) => void
    loadSettings: () => TSettings | null
    saveSettings: (settings: TSettings) => void
    loadGameState: () => SavedGameState<TCard, TSettings> | null
    saveGameState: (state: SavedGameState<TCard, TSettings>) => void
    clearGameState: () => void
    setGameResult: (result: GameResult) => void
  }
  gameStateFlowConfig: GameStateFlowConfig
  /** Unique identity key of a card (voc: `c.voc`, lwk: `c.word`) */
  getKey: (card: TCard) => string
  /** Select cards for a round (standard/3-rounds mode) */
  selectCards: (cards: TCard[], settings: TSettings) => TCard[]
  /** Difficulty points based on the active game mode */
  getDifficultyPoints: (settings: TSettings) => number
  /** Whether answer times are tracked for the given settings (voc: all modes, lwk: hidden) */
  tracksTime: (settings: TSettings) => boolean
  /** Time bonus predicate (keeps per-app comparator semantics) */
  timeBonusPredicate: (
    card: TCard,
    answerTime: number | undefined,
    result: AnswerStatus,
    settings: TSettings
  ) => boolean
  /** Optional extra points for a correct answer (voc: de-voc language bonus) */
  getLanguageBonus?: (result: AnswerStatus, settings: TSettings) => number
  /** Validate an imported card */
  isValidImportCard: (card: TCard) => boolean
  /** Cards used to initialize a newly created deck */
  newDeckCards: () => TCard[]
  /** Fallback deck name when the current deck is removed */
  getDefaultDeckName: () => string
  /** Reset all cards to the app default set (voc: INITIAL_CARDS, lwk: default deck) */
  resetCards: (ctx: { setAllCards: (cards: TCard[]) => void }) => void
}

/**
 * Update a card's level and time based on the answer result.
 * Time is only touched when the app tracks time for the current mode.
 */
function updateCardLevelAndTime<TCard extends BaseCard>(
  card: TCard,
  result: AnswerStatus,
  answerTime: number | undefined,
  trackTime: boolean
): Partial<TCard> {
  const updates: Partial<TCard> = {}
  if (result === 'correct') {
    updates.level = Math.min(MAX_LEVEL, card.level + 1)
  } else if (result === 'incorrect') {
    updates.level = Math.max(MIN_LEVEL, card.level - 1)
    if (trackTime) {
      updates.time = MAX_TIME
    }
  }
  if (result === 'correct' && trackTime && answerTime !== undefined) {
    const clampedTime = Math.max(MIN_TIME, Math.min(MAX_TIME, answerTime))
    updates.time = roundTime(clampedTime)
  }
  return updates
}

/**
 * Select cards based on session mode (shared between voc and lwk)
 */
function selectCardsByMode<TCard extends BaseCard, TSettings>(
  pool: TCard[],
  mode: SessionMode,
  settings: TSettings,
  selectCards: (cards: TCard[], settings: TSettings) => TCard[]
): TCard[] {
  if (mode === 'endless-level1') {
    return shuffleArray(filterLevel1Cards(pool))
  }
  if (mode === 'endless-level5') {
    return shuffleArray(filterBelowMaxLevel(pool))
  }
  if (mode === '3-rounds') {
    const focusSelected = selectCards(pool, settings)
    return repeatCards(focusSelected, LOOP_COUNT)
  }
  return selectCards(pool, settings)
}

/**
 * Create a deck-based game store composable from app-specific config.
 * Returns a function that, when called, returns the full store API.
 */
export function createDeckGameStore<
  TCard extends BaseCard,
  THistory extends BaseGameHistory,
  TSettings extends { focus: string; deck?: string; levels?: number[] }
>(config: DeckGameStoreConfig<TCard, THistory, TSettings>) {
  const { storage } = config

  // Create base store with shared state and logic
  const baseStore = createBaseGameStore<TCard, THistory, TSettings>({
    loadCards: storage.loadCards,
    loadHistory: storage.loadHistory,
    saveHistory: storage.saveHistory,
    loadGameStats: storage.loadGameStats,
    saveGameStats: storage.saveGameStats,
    saveCards: storage.saveCards
  })

  // Deck management composable
  const deckManagement = useDeckManagement<TCard, TSettings>({
    loadDecks: storage.loadDecks,
    saveDecks: storage.saveDecks,
    loadSettings: storage.loadSettings,
    saveSettings: storage.saveSettings
  })

  function buildPointsBreakdown(
    result: AnswerStatus,
    card: TCard,
    settings: TSettings,
    answerTime: number | undefined
  ) {
    return calculatePointsBreakdown({
      difficultyPoints: config.getDifficultyPoints(settings),
      level: card.level,
      timeBonus: config.timeBonusPredicate(card, answerTime, result, settings),
      closeAdjustment: result === 'close',
      languageBonus: config.getLanguageBonus ? config.getLanguageBonus(result, settings) : 0
    })
  }

  function applyAnswerUpdates(updates: Partial<TCard>, card: TCard) {
    baseStore.allCards.value = baseStore.allCards.value.map(c =>
      config.getKey(c) === config.getKey(card) ? { ...c, ...updates } : c
    )
    // Also update the in-memory gameCards entry (needed for endless mode card removal check)
    if (updates.level !== undefined) card.level = updates.level
    if (updates.time !== undefined) card.time = updates.time
  }

  return function useGameStore() {
    // Initialize store on first use
    baseStore.initializeStore()

    // Track initial card count for endless mode (where gameCards shrinks)
    const initialCardCount = ref(0)

    // Restore game state and settings if page was reloaded during a game
    // Only restore if there was an active game saved
    const savedGameState = storage.loadGameState()

    if (savedGameState && savedGameState.gameCards.length > 0) {
      // Restore game settings from saved state
      baseStore.gameSettings.value = savedGameState.gameSettings
      // Restore game state
      baseStore.gameCards.value = savedGameState.gameCards
      baseStore.currentCardIndex.value = savedGameState.currentCardIndex
      baseStore.points.value = savedGameState.points
      baseStore.correctAnswersCount.value = savedGameState.correctAnswersCount
      baseStore.sessionMode.value = savedGameState.sessionMode ?? 'standard'
      initialCardCount.value = savedGameState.initialCardCount ?? savedGameState.gameCards.length
    }

    // Helper function to save current game state to sessionStorage
    function saveCurrentGameState() {
      storage.saveGameState({
        gameCards: baseStore.gameCards.value,
        currentCardIndex: baseStore.currentCardIndex.value,
        points: baseStore.points.value,
        correctAnswersCount: baseStore.correctAnswersCount.value,
        gameSettings: baseStore.gameSettings.value as TSettings,
        sessionMode: baseStore.sessionMode.value,
        initialCardCount: initialCardCount.value
      })
    }

    function nextCard(): boolean {
      const isGameOver = handleNextCard(
        baseStore.gameCards,
        baseStore.currentCardIndex,
        baseStore.sessionMode.value,
        config.getKey
      )

      if (!isGameOver) {
        saveCurrentGameState()
      }
      return isGameOver
    }

    function startGame(settings: TSettings, mode: SessionMode = 'standard') {
      // Only start a new game if there are no cards in session storage (new game)
      // If cards exist, user reloaded page during game - just resume (return early)
      if (baseStore.gameCards.value.length > 0) {
        return
      }

      // Ensure the correct deck is loaded before starting the game
      if (settings.deck !== undefined && settings.deck !== '') {
        switchDeck(settings.deck)
      }

      baseStore.gameSettings.value = settings
      baseStore.resetGameState()
      baseStore.sessionMode.value = mode

      // Respect the selected card levels
      const pool = filterByLevels(baseStore.allCards.value, settings.levels ?? [])
      const selectedCards = selectCardsByMode(pool, mode, settings, config.selectCards)

      // Use centralized game state flow to store settings + selected cards
      initializeGameFlow(config.gameStateFlowConfig, settings, selectedCards)

      baseStore.gameCards.value = selectedCards
      initialCardCount.value = selectedCards.length

      // Save initial game state to sessionStorage for page reload persistence
      saveCurrentGameState()
    }

    function handleAnswer(result: AnswerStatus, answerTime?: number) {
      const card = currentCard.value
      const settings = baseStore.gameSettings.value
      if (!(card && settings)) return

      if (result === 'correct' || result === 'close') {
        baseStore.handleAnswerBase(result, buildPointsBreakdown(result, card, settings, answerTime))
      }

      // Update card level and time in allCards
      const updates = updateCardLevelAndTime(card, result, answerTime, config.tracksTime(settings))
      applyAnswerUpdates(updates, card)

      // Explicitly save cards on every answer
      storage.saveCards(baseStore.allCards.value)

      // Save game state to sessionStorage for page reload persistence
      saveCurrentGameState()
    }

    function finishGame() {
      const settings = baseStore.gameSettings.value
      if (!settings) return

      // For endless mode, gameCards is empty at game end, so use initialCardCount
      const totalCards = isEndlessMode(baseStore.sessionMode.value)
        ? initialCardCount.value
        : baseStore.gameCards.value.length

      const historyEntry: THistory = {
        date: new Date().toISOString(),
        points: baseStore.points.value,
        settings,
        correctAnswers: baseStore.correctAnswersCount.value,
        totalCards
      } as unknown as THistory

      // Update history and stats in memory only - GameOverPage will save to localStorage
      baseStore.history.value = [...baseStore.history.value, historyEntry]
      baseStore.gameStats.value.gamesPlayed++
      // points and correctAnswers already persisted per-answer in handleAnswerBase

      // Save game result to sessionStorage for GameOverPage
      storage.setGameResult({
        points: baseStore.points.value,
        correctAnswers: baseStore.correctAnswersCount.value,
        totalCards
      })

      // Clear game state from sessionStorage
      storage.clearGameState()

      // Clear session mode
      baseStore.sessionMode.value = 'standard'

      // Reset in-memory game state to prevent "11/10" bug when starting a new game
      baseStore.resetGameState()
      // Clear game cards to ensure fresh load from localStorage on next game start
      baseStore.gameCards.value = []
    }

    function discardGame() {
      // Clear game state from sessionStorage when user abandons the game
      storage.clearGameState()
      // Reset game state in memory (delegated to base store)
      baseStore.discardGame()
    }

    function resetCards() {
      storage.clearGameState()
      config.resetCards({
        setAllCards: cards => {
          baseStore.allCards.value = cards
        }
      })
    }

    function importCards(newCards: TCard[]) {
      if (newCards.length === 0) return
      const validCards = newCards.filter(config.isValidImportCard)
      if (validCards.length === 0) return
      baseStore.allCards.value = validCards
      // Explicitly save to ensure cards are persisted immediately
      storage.saveCards(validCards)
    }

    function switchDeck(deckName: string) {
      const decks = storage.loadDecks()
      const deck = decks.find(d => d.name === deckName)
      if (!deck) {
        return
      }
      // Update all cards to the new deck's cards
      baseStore.allCards.value = deck.cards
    }

    function addDeck(name: string): boolean {
      const decks = storage.loadDecks()
      // Check for duplicate name
      if (decks.some(d => d.name === name)) {
        return false
      }
      decks.push({ name, cards: config.newDeckCards() })
      storage.saveDecks(decks)
      return true
    }

    function removeDeckAndSwitch(name: string): boolean {
      const settings = storage.loadSettings()
      const currentDeck = settings?.deck ?? config.getDefaultDeckName()
      const isCurrentDeck = currentDeck === name

      const success = deckManagement.removeDeck(name)

      if (success && isCurrentDeck) {
        // Active deck was removed, switch to the new default deck
        const newSettings = storage.loadSettings()
        if (newSettings?.deck !== undefined && newSettings.deck !== '') {
          switchDeck(newSettings.deck)
        }
      }
      return success
    }

    // Computed
    const currentCard = computed(() => {
      return baseStore.gameCards.value[baseStore.currentCardIndex.value] ?? null
    })

    return {
      // State (from base store)
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

      // Actions
      startGame,
      handleAnswer,
      nextCard,
      finishGame,
      discardGame,
      resetCards,
      importCards,
      moveAllCards: baseStore.moveAllCards,

      // Deck management
      getDecks: deckManagement.getDecks,
      addDeck,
      removeDeck: removeDeckAndSwitch,
      renameDeck: deckManagement.renameDeck,
      switchDeck
    }
  }
}
