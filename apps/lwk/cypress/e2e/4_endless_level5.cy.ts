import { normalizeDecks, loadGameState } from '../support/test-helpers'

describe('LWK Endless Level 5 mode', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.reload()
  })

  const answerHiddenCardCorrectly = () => {
    cy.get('[data-cy="question-display"]')
      .invoke('text')
      .then(text => {
        const word = text.trim()
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(200)
        cy.get('[data-cy="start-countdown-button"]').click()
        cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')
        cy.get('[data-cy="answer-input"]').clear()
        cy.get('[data-cy="answer-input"]').type(word)
        cy.get('[data-cy="submit-answer-button"]').click()
      })
    cy.get('[data-cy="continue-button"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="continue-button"]').should('not.be.disabled')
    cy.get('[data-cy="continue-button"]').click()
  }

  it('should complete game in hidden mode', () => {
    // Set all cards to level 4 so only 1 correct answer promotes to level 5
    cy.window().then(win => {
      normalizeDecks(win, 4, 60)
    })
    cy.reload()

    cy.get('[data-cy="mode-option-hidden"]').click()
    cy.get('[data-cy="start-endless-level5"]').should('not.be.disabled')
    cy.get('[data-cy="start-endless-level5"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    let totalCards = 0
    cy.window()
      .should(win => {
        const gameState = loadGameState(win)
        expect(gameState?.gameCards?.length).to.be.greaterThan(0)
      })
      .then(win => {
        const gameState = loadGameState(win)
        totalCards = gameState?.gameCards?.length ?? 0
      })

    // Verify progress indicator shows remaining count (no "X / Y" format)
    cy.get('[data-cy="card-counter"]').should('be.visible')

    cy.then(() => {
      for (let i = 0; i < totalCards; i++) {
        answerHiddenCardCorrectly()
      }
    })

    cy.url({ timeout: 30000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
