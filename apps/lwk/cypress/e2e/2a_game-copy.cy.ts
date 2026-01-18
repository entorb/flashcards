import { normalizeDecks, loadGameState } from '../support/test-helpers'

export const CYPRESS_SPEC_COPY = true

describe('Copy Mode Game', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.reload()

    cy.window().then(win => {
      normalizeDecks(win, 2, 60)
    })

    cy.reload()
  })

  it('should complete a game with 1 wrong and remaining correct answers', () => {
    cy.get('[data-cy="app-title"]').should('be.visible')

    cy.get('[data-cy="mode-option-copy"]').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="word-display"]', { timeout: 10000 }).should('be.visible')

    let totalCards = 0

    cy.window()
      .should(win => {
        const gameState = loadGameState(win)
        const gameCardCount = gameState?.gameCards?.length ?? 0
        expect(gameCardCount).to.be.greaterThan(0)
      })
      .then(win => {
        const gameState = loadGameState(win)
        totalCards = gameState?.gameCards?.length ?? 0
      })

    const answerCard = (isCorrect: boolean) => {
      cy.get('[data-cy="word-display"]')
        .invoke('text')
        .then(text => {
          const word = text.trim()
          const answer = isCorrect ? word : `${word}zz`
          cy.get('[data-cy="spelling-input"]').clear()
          cy.get('[data-cy="spelling-input"]').type(answer)
          cy.get('[data-cy="submit-button"]').click()
        })

      cy.get('[data-cy="proceed-button"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="proceed-button"]').should('not.be.disabled')
      cy.get('[data-cy="proceed-button"]').click()
    }

    cy.then(() => {
      for (let i = 0; i < totalCards; i++) {
        const isCorrect = i !== 0
        answerCard(isCorrect)
      }
    })

    cy.url({ timeout: 10000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    let gameOverPoints = 0
    let gameOverCorrectAnswers = 0

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        gameOverCorrectAnswers = Number.parseInt(text.trim(), 10)
        expect(gameOverCorrectAnswers).to.equal(totalCards - 1)
      })

    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        gameOverPoints = Number.parseInt(text.trim(), 10)
        expect(gameOverPoints).to.be.greaterThan(0)
      })

    cy.get('[data-cy="back-to-home-button"]').click()
    cy.url().should('not.include', '/game-over')
    cy.get('[data-cy="app-title"]').should('be.visible')

    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const homePoints = Number.parseInt(text.trim(), 10)
        expect(homePoints).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        const homeCorrect = Number.parseInt(text.trim(), 10)
        expect(homeCorrect).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="stats-games-played"]').should('contain', '1')

    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.get('[data-cy="history-page-title"]').should('be.visible')

    cy.get('[data-cy="history-game-0"]').should('be.visible')

    cy.get('[data-cy="history-game-0-correct"]')
      .invoke('text')
      .then(text => {
        const historyCorrect = Number.parseInt(text.trim(), 10)
        expect(historyCorrect).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="history-game-0-points"]')
      .invoke('text')
      .then(text => {
        const historyPoints = Number.parseInt(text.trim(), 10)
        expect(historyPoints).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="back-button"]').click()
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Verify stats are correct - this validates the game logic worked properly
    // (Card level changes are app implementation details verified by unit tests)
  })
})
