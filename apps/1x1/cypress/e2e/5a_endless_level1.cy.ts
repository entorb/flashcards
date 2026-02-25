import {
  answerCurrentCardCorrectly,
  startGameModeWithTable6,
  playThroughAndVerifyGameOver
} from '../support/test-helpers'

describe('1x1 Endless Level 1 mode', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete Endless Level 1 game with table [6]', () => {
    // Select only table [6] → 7 cards (3×6 through 9×6), all Level 1 in fresh state
    startGameModeWithTable6('start-endless-level1')

    // Progress shows remaining count (7 cards, no "X / Y" format)
    cy.get('[data-cy="card-counter"]').should('contain', '7')

    // Answer all 7 cards correctly — each correct answer removes a card
    playThroughAndVerifyGameOver(7, answerCurrentCardCorrectly)
  })
})
