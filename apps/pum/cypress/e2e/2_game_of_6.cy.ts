import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from '../support/test-helpers'

describe('pum Full Game Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete game with 1 wrong and 9 correct answers', () => {
    // Select plus only (tap plus when all are selected → selects only plus)
    cy.get('[data-cy="operation-button-plus"]').click()
    cy.get('[data-cy="operation-button-plus"]').should('have.class', 'q-btn--unelevated')

    // Select simple difficulty only (tap simple when all are selected → selects only simple)
    cy.get('[data-cy="difficulty-button-simple"]').click()
    cy.get('[data-cy="difficulty-button-simple"]').should('have.class', 'q-btn--unelevated')

    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Answer first question wrong, then 9 correct (10 cards total)
    answerCurrentCardWrong()
    for (let i = 0; i < 9; i++) {
      answerCurrentCardCorrectly()
    }

    verifyPostGameStats(9, 10)
  })

  it('should correctly increment stats and reset state across multiple games', () => {
    // Verify initial stats are zero
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Play first game — select plus only + simple difficulty (55 cards, 10 per game)
    cy.get('[data-cy="operation-button-plus"]').click()
    cy.get('[data-cy="difficulty-button-simple"]').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')

    for (let i = 0; i < 10; i++) {
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
        expect(game1CorrectAnswers).to.equal(10)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify stats after first game
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '10')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points)
      })

    // Play second game — switch to minus only + simple difficulty
    // First tap plus to restore all operations, then tap minus to select only minus
    cy.get('[data-cy="operation-button-plus"]').then($btn => {
      if ($btn.hasClass('q-btn--unelevated')) {
        cy.wrap($btn).click()
      }
    })
    cy.get('[data-cy="operation-button-minus"]').click()
    cy.get('[data-cy="operation-button-minus"]').should('have.class', 'q-btn--unelevated')

    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Verify game starts fresh
    cy.get('[data-cy="card-counter"]').should('contain', '1')

    for (let i = 0; i < 10; i++) {
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
        expect(game2CorrectAnswers).to.equal(10)
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
