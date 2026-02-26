// Shared test utilities for LWK Cypress tests

import { STORAGE_KEYS } from '../../src/constants'

export type SpellCard = {
  word: string
  level: number
  time: number
}

export type SpellDeck = {
  name: string
  cards: SpellCard[]
}

export type LwkGameState = {
  gameCards?: SpellCard[]
}

/** Default deck name used in test seeding */
const TEST_DECK_NAME = 'LWK_1'

/** Number of cards to use in Cypress tests (keep low for speed) */
export const TEST_CARD_COUNT = 4

//cspell:disable
/** Standard test cards — 4 words at level 1 */
const DEFAULT_TEST_CARDS: SpellCard[] = [
  { word: 'Jahr', level: 1, time: 60 },
  { word: 'bleiben', level: 1, time: 60 },
  { word: 'Januar', level: 1, time: 60 },
  { word: 'essen', level: 1, time: 60 }
]
//cspell:enable

/**
 * Seed localStorage with exactly TEST_CARD_COUNT cards before the app loads.
 * Also sets the deck selection in settings so tests don't depend on default deck fallback.
 * Use in `cy.visit('/', { onBeforeLoad(win) { seedTestCards(win) } })`.
 *
 * @param level - optional level for all cards (default 1)
 */
export const seedTestCards = (win: Cypress.AUTWindow, level = 1): void => {
  const cards = DEFAULT_TEST_CARDS.map(c => ({ ...c, level }))
  const decks: SpellDeck[] = [{ name: TEST_DECK_NAME, cards }]
  win.localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks))
  // Explicitly set the selected deck in settings (independent of app defaults)
  const settings = { deck: TEST_DECK_NAME }
  win.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}

export const loadGameState = (win: Cypress.AUTWindow): LwkGameState | null => {
  const stored = win.sessionStorage.getItem(STORAGE_KEYS.GAME_STATE)
  if (!stored) return null
  try {
    return JSON.parse(stored) as LwkGameState
  } catch {
    return null
  }
}

/**
 * Answer a card in copy mode (word visible while typing).
 * @param isCorrect - true to type the correct word, false to type a wrong answer
 */
export const answerCopyCard = (isCorrect: boolean): void => {
  cy.get('[data-cy="question-display"]')
    .invoke('text')
    .then(text => {
      const word = text.trim()
      const answer = isCorrect ? word : `${word}zz`
      cy.get('[data-cy="answer-input"]').clear()
      cy.get('[data-cy="answer-input"]').type(answer)
      cy.get('[data-cy="submit-answer-button"]').click()
    })
  cy.get('[data-cy="continue-button"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-cy="continue-button"]').should('not.be.disabled')
  cy.get('[data-cy="continue-button"]').click()
}

/**
 * Answer a card in hidden mode (word shown briefly then hidden).
 * @param isCorrect - true to type the correct word, false to type a wrong answer
 */
export const answerHiddenCard = (isCorrect: boolean): void => {
  cy.get('[data-cy="question-display"]')
    .invoke('text')
    .then(text => {
      const word = text.trim()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200)
      cy.get('[data-cy="start-countdown-button"]').click()
      cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')
      const answer = isCorrect ? word : `${word}zz`
      cy.get('[data-cy="answer-input"]').clear()
      cy.get('[data-cy="answer-input"]').type(answer)
      cy.get('[data-cy="submit-answer-button"]').click()
    })
  cy.get('[data-cy="continue-button"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-cy="continue-button"]').should('not.be.disabled')
  cy.get('[data-cy="continue-button"]').click()
}

/** Answer the current card correctly in copy mode (convenience wrapper). */
export const answerCopyCardCorrectly = (): void => {
  answerCopyCard(true)
}

/** Answer the current card correctly in hidden mode (convenience wrapper). */
export const answerHiddenCardCorrectly = (): void => {
  answerHiddenCard(true)
}

/**
 * Start a game mode from the home page in hidden mode.
 */
export const startHiddenGameMode = (buttonCy: string): void => {
  cy.get('[data-cy="mode-option-hidden"]').click()
  cy.get(`[data-cy="${buttonCy}"]`).should('not.be.disabled')
  cy.get(`[data-cy="${buttonCy}"]`).click()
  cy.url().should('include', '/game')
  cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
}

/**
 * Start a game mode from the home page in copy mode (faster than hidden).
 */
export const startCopyGameMode = (buttonCy: string): void => {
  cy.get('[data-cy="mode-option-copy"]').click()
  cy.get(`[data-cy="${buttonCy}"]`).should('not.be.disabled')
  cy.get(`[data-cy="${buttonCy}"]`).click()
  cy.url().should('include', '/game')
  cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
}

/**
 * Get the total card count from session storage game state.
 */
export const getGameCardCount = (): Cypress.Chainable<number> => {
  return cy
    .window()
    .should(win => {
      const gameState = loadGameState(win)
      expect(gameState?.gameCards?.length).to.be.greaterThan(0)
    })
    .then(win => {
      const gameState = loadGameState(win)
      return gameState?.gameCards?.length ?? 0
    })
}

/**
 * Play through all cards and verify game-over, then navigate home.
 */
export const playThroughAndVerifyGameOver = (totalCards: number, answerFn: () => void): void => {
  for (let i = 0; i < totalCards; i++) {
    answerFn()
  }
  cy.url({ timeout: 60000 }).should('include', '/game-over')
  cy.get('[data-cy="back-to-home-button"]').click()
  cy.get('[data-cy="app-title"]').should('be.visible')
}

/**
 * Verify game-over stats, then check home page and history page match.
 */
export const verifyPostGameStats = (expectedCorrect: number): void => {
  cy.url({ timeout: 10000 }).should('include', '/game-over')
  cy.get('[data-cy="back-to-home-button"]').should('be.visible')

  let gameOverPoints = 0
  let gameOverCorrectAnswers = 0

  cy.get('[data-cy="correct-answers-count"]')
    .invoke('text')
    .then(text => {
      gameOverCorrectAnswers = Number.parseInt(text.trim(), 10)
      expect(gameOverCorrectAnswers).to.equal(expectedCorrect)
    })

  cy.get('[data-cy="final-points"]')
    .invoke('text')
    .then(text => {
      gameOverPoints = Number.parseInt(text.trim(), 10)
      expect(gameOverPoints).to.be.greaterThan(0)
    })

  cy.get('[data-cy="back-to-home-button"]').click()
  cy.get('[data-cy="app-title"]').should('be.visible')

  // Verify home page stats match
  cy.get('[data-cy="stats-total-points"]')
    .invoke('text')
    .then(text => {
      expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverPoints)
    })

  cy.get('[data-cy="stats-correct-answers"]')
    .invoke('text')
    .then(text => {
      expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverCorrectAnswers)
    })

  cy.get('[data-cy="stats-games-played"]').should('contain', '1')

  // Verify history page stats match
  cy.get('[data-cy="history-button"]').click()
  cy.url().should('include', '/history')
  cy.get('[data-cy="history-game-0"]').should('be.visible')

  cy.get('[data-cy="history-game-0-correct"]')
    .invoke('text')
    .then(text => {
      expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverCorrectAnswers)
    })

  cy.get('[data-cy="history-game-0-points"]')
    .invoke('text')
    .then(text => {
      expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverPoints)
    })

  cy.get('[data-cy="back-button"]').click()
  cy.get('[data-cy="app-title"]').should('be.visible')
}
