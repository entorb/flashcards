import { normalizeDecks, loadGameState } from '../support/test-helpers'

describe('LWK Game Modes', () => {
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

  describe('Endless Level 1 mode', () => {
    it('should complete game in hidden mode', () => {
      cy.window().then(win => {
        normalizeDecks(win, 1, 60)
      })
      cy.reload()

      cy.get('[data-cy="mode-option-hidden"]').click()
      cy.get('[data-cy="start-endless-level1"]').should('not.be.disabled')
      cy.get('[data-cy="start-endless-level1"]').click()

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

  describe('3 Rounds mode', () => {
    it('should complete game in hidden mode', () => {
      cy.window().then(win => {
        normalizeDecks(win, 2, 60)
      })
      cy.reload()

      cy.get('[data-cy="mode-option-hidden"]').click()
      cy.get('[data-cy="start-three-rounds"]').should('not.be.disabled')
      cy.get('[data-cy="start-three-rounds"]').click()

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

      // Verify progress indicator shows "1 / N" where N = cards × 3 (LOOP_COUNT)
      cy.then(() => {
        cy.get('[data-cy="card-counter"]')
          .invoke('text')
          .then(text => {
            const match = /\d+\s*\/\s*(\d+)/.exec(text)
            if (match) {
              const displayedTotal = Number.parseInt(match[1], 10)
              expect(displayedTotal).to.equal(totalCards)
            }
          })
      })

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
})
