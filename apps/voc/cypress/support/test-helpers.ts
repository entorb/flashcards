// Shared test utilities for VOC Cypress tests

import { getCardsFromStorage } from './commands'

/** Number of cards to use in Cypress tests (keep low for speed) */
export const TEST_CARD_COUNT = 4

/** Seed localStorage with exactly `TEST_CARD_COUNT` cards at level 1 */
export const seedTestCards = (win: Cypress.AUTWindow): void => {
  const testCards = [
    { voc: 'Where', de: 'Wo', level: 1, time: 60 },
    { voc: 'Who', de: 'Wer', level: 1, time: 60 },
    { voc: 'What', de: 'Was', level: 1, time: 60 },
    { voc: 'Why', de: 'Warum', level: 1, time: 60 }
  ]
  win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: testCards }]))
  // Explicitly set the selected deck in settings (independent of app defaults)
  const settings = { deck: 'en' }
  win.localStorage.setItem('fc-voc-settings', JSON.stringify(settings))
}

/**
 * Answer the current card correctly in typing mode:
 * read the question, find the matching card, type the answer, submit, continue.
 */
export const answerCurrentCardCorrectly = (): void => {
  cy.window().then(win => {
    const cards = getCardsFromStorage(win)
    cy.get('[data-cy="question-display"]')
      .invoke('text')
      .then(questionText => {
        const trimmed = questionText.trim()
        const card = cards.find(c => c.voc === trimmed)
        const correctAnswer = card ? card.de.split('/')[0].trim() : ''
        cy.get('[data-cy="answer-input"]').clear()
        cy.get('[data-cy="answer-input"]').type(correctAnswer)
        cy.get('[data-cy="submit-answer-button"]').click()
        cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-cy="continue-button"]').click()
      })
  })
}

/**
 * Answer a multiple-choice card by finding the correct/wrong option.
 * @param isCorrect - true to click the correct option, false to click a wrong one
 */
export const answerMultipleChoiceCard = (isCorrect: boolean): void => {
  cy.window().then(win => {
    const cards = getCardsFromStorage(win)
    cy.get('[data-cy="question-display"]')
      .invoke('text')
      .then(questionText => {
        const card = cards.find(c => c.voc === questionText.trim())
        const correctAnswer = card ? card.de : ''

        cy.get('[data-cy="multiple-choice-option"]').then($buttons => {
          let correctIndex = -1
          $buttons.each((index, btn) => {
            if (btn.textContent?.trim() === correctAnswer) {
              correctIndex = index
              return false
            }
          })

          if (isCorrect && correctIndex >= 0) {
            cy.get('[data-cy="multiple-choice-option"]').eq(correctIndex).click()
          } else {
            const wrongIndex = correctIndex === 0 ? 1 : 0
            cy.get('[data-cy="multiple-choice-option"]').eq(wrongIndex).click()
          }
        })

        cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
        if (!isCorrect) {
          cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled')
        }
        cy.get('[data-cy="continue-button"]').click()
      })
  })
}

/**
 * Answer a blind-mode card.
 * @param isCorrect - true to click Yes, false to click No
 */
export const answerBlindCard = (isCorrect: boolean): void => {
  cy.get('[data-cy="reveal-answer-button"]', { timeout: 10000 }).should('be.visible').click()

  if (isCorrect) {
    cy.get('[data-cy="blind-yes-button"]').should('be.visible').click()
  } else {
    cy.get('[data-cy="blind-no-button"]').should('be.visible').click()
  }

  cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible').as('continueBtn')
  if (!isCorrect) {
    cy.get('@continueBtn', { timeout: 5000 }).should('not.be.disabled')
  }
  cy.get('@continueBtn').click({ force: true })
}

/**
 * Start a game mode from the home page in typing mode.
 */
export const startTypingGameMode = (buttonCy: string): void => {
  // cspell:disable-next-line
  cy.contains('Schreiben').click()
  cy.get(`[data-cy="${buttonCy}"]`).should('not.be.disabled')
  cy.get(`[data-cy="${buttonCy}"]`).click()
  cy.url().should('include', '/game')
  cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
}

/**
 * Play through all cards, verify game-over with correct count, then navigate home.
 */
export const playThroughAndVerifyGameOver = (totalCards: number, answerFn: () => void): void => {
  for (let i = 0; i < totalCards; i++) {
    answerFn()
  }
  cy.url({ timeout: 15000 }).should('include', '/game-over')
  cy.get('[data-cy="correct-answers-count"]').should('contain', String(totalCards))
  cy.get('[data-cy="back-to-home-button"]').click()
  cy.get('[data-cy="app-title"]').should('be.visible')
}

/**
 * Verify game-over stats, then check home page and history page match.
 */
export const verifyPostGameStats = (expectedCorrect: number, expectedTotal: number): void => {
  cy.url({ timeout: 15000 }).should('include', '/game-over')

  let gameOverPoints = 0
  let gameOverCorrectAnswers = 0

  cy.get('[data-cy="correct-answers-count"]').should('contain', String(expectedCorrect))
  cy.get('[data-cy="total-questions-count"]').should('contain', String(expectedTotal))

  cy.get('[data-cy="final-points"]')
    .invoke('text')
    .then(text => {
      gameOverPoints = Number.parseInt(text.trim(), 10)
      expect(gameOverPoints).to.be.greaterThan(0)
    })

  cy.get('[data-cy="correct-answers-count"]')
    .invoke('text')
    .then(text => {
      gameOverCorrectAnswers = Number.parseInt(text.trim(), 10)
      expect(gameOverCorrectAnswers).to.equal(expectedCorrect)
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
