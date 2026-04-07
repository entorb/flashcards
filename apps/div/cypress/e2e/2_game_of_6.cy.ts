import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from '../support/test-helpers'

describe('div Full Game Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete game with 1 wrong and 7 correct answers', () => {
    // Select divisor [6] — gives 8 cards (12:6, 18:6, 24:6, 30:6, 36:6, 42:6, 48:6, 54:6)
    cy.get('[data-cy="table-selection-button-6"]').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Answer first question wrong, then 7 correct
    answerCurrentCardWrong()
    for (let i = 0; i < 7; i++) {
      answerCurrentCardCorrectly()
    }

    verifyPostGameStats(7, 8)
  })

  it('should correctly increment stats and reset state across multiple games', () => {
    // Verify initial stats are zero
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Play first game — select divisor [3] (8 cards: 6:3, 9:3, 12:3, 15:3, 18:3, 21:3, 24:3, 27:3)
    cy.get('[data-cy="table-selection-button-3"]').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')

    for (let i = 0; i < 8; i++) {
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
        expect(game1CorrectAnswers).to.equal(8)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify stats after first game
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '8')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points)
      })

    // Play second game — select divisor [4]
    // First deselect 3 if it's the only one selected (tap restores all), then tap 4
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

    for (let i = 0; i < 8; i++) {
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
        expect(game2CorrectAnswers).to.equal(8)
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
