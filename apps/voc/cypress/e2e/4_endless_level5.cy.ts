import { getCardsFromStorage } from '../support/commands'

interface VocCard {
  voc: string
  de: string
  level: number
  time: number
}

describe('VOC Endless Level 5 mode', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  function answerCurrentCardCorrectly() {
    cy.window().then(win => {
      const cards = getCardsFromStorage(win) as VocCard[]
      cy.get('[data-cy="question-display"]')
        .invoke('text')
        .then(questionText => {
          const trimmed = questionText.trim()
          const card = cards.find((c: VocCard) => c.voc === trimmed)
          const correctAnswer = card ? card.de.split('/')[0].trim() : ''
          cy.get('[data-cy="answer-input"]').clear()
          cy.get('[data-cy="answer-input"]').type(correctAnswer)
          cy.get('[data-cy="submit-answer-button"]').click()
          cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
          cy.get('[data-cy="continue-button"]').click()
        })
    })
  }

  it('should complete game in typing mode', () => {
    // Select typing mode
    // cspell:disable-next-line
    cy.contains('Schreiben').click()

    // Endless Level 5 button should be enabled (default deck has cards below level 5)
    cy.get('[data-cy="start-endless-level5"]').should('not.be.disabled')

    // Start Endless Level 5 mode
    cy.get('[data-cy="start-endless-level5"]').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Default deck has 8 cards below level 5 — progress shows remaining count
    cy.get('[data-cy="card-counter"]').should('contain', '8')

    // Total correct answers needed: 2×4 + 2×3 + 2×2 + 2×1 = 20
    for (let i = 0; i < 20; i++) {
      answerCurrentCardCorrectly()
    }

    // After all cards reach level 5, should reach game-over page
    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    // Verify correct answers count
    cy.get('[data-cy="correct-answers-count"]').should('contain', '20')

    // Navigate back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
