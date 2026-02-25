import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from '../support/test-helpers'

describe('1x1 Full Game Flow', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete game with 1 wrong and 6 correct answers', () => {
    cy.get('[data-cy="table-selection-button-6"]').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Answer first question wrong, then 6 correct
    answerCurrentCardWrong()
    for (let i = 0; i < 6; i++) {
      answerCurrentCardCorrectly()
    }

    verifyPostGameStats(6, 7)
  })

  it('should correctly increment stats and reset state across multiple games', () => {
    // Verify initial stats are zero
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Play first game — select table [3] (7 cards)
    cy.get('[data-cy="table-selection-button-3"]').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')

    for (let i = 0; i < 7; i++) {
      answerCurrentCardCorrectly()
    }

    cy.url({ timeout: 10000 }).should('include', '/game-over')

    let game1Points = 0
    let game1CorrectAnswers = 0
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game1Points = Number.parseInt(text.trim(), 10)
      })
    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        game1CorrectAnswers = Number.parseInt(text.trim(), 10)
        expect(game1CorrectAnswers).to.equal(7)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify stats after first game
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '7')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points)
      })

    // Play second game — select table [4] (7 cards)
    cy.get('[data-cy="table-selection-button-3"]').then($btn => {
      if ($btn.hasClass('q-btn--unelevated')) {
        cy.wrap($btn).click()
      }
    })
    cy.get('[data-cy="table-selection-button-4"]').click()
    cy.get('[data-cy="table-selection-button-4"]').should('have.class', 'q-btn--unelevated')

    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Verify game starts fresh
    cy.get('[data-cy="card-counter"]').should('contain', '1')
    cy.get('[data-cy="card-counter"]').should('contain', '7')

    for (let i = 0; i < 7; i++) {
      answerCurrentCardCorrectly()
    }

    cy.url({ timeout: 10000 }).should('include', '/game-over')

    let game2Points = 0
    let game2CorrectAnswers = 0
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game2Points = Number.parseInt(text.trim(), 10)
      })
    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        game2CorrectAnswers = Number.parseInt(text.trim(), 10)
        expect(game2CorrectAnswers).to.equal(7)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify cumulative stats
    cy.get('[data-cy="stats-games-played"]').should('contain', '2')
    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1CorrectAnswers + game2CorrectAnswers)
      })
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points + game2Points)
      })
  })
})
