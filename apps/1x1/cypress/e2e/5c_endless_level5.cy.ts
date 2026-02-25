import {
  answerCurrentCardCorrectly,
  startGameModeWithTable6,
  playThroughAndVerifyGameOver
} from '../support/test-helpers'

describe('1x1 Endless Level 5 mode', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete Endless Level 5 game with table [6]', () => {
    // Select only table [6] → 7 cards, all Level 1 in fresh state
    startGameModeWithTable6('start-endless-level5')

    // Progress shows remaining count (7 cards below level 5)
    cy.get('[data-cy="card-counter"]').should('contain', '7')

    // Each card needs 4 correct answers to go from level 1 → 5
    // 7 cards × 4 promotions = 28 total answers
    playThroughAndVerifyGameOver(28, answerCurrentCardCorrectly)
  })
})
