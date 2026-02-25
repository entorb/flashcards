import {
  answerCurrentCardCorrectly,
  startGameModeWithTable6,
  playThroughAndVerifyGameOver
} from '../support/test-helpers'

describe('1x1 3 Rounds mode', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should play a complete 3 Rounds game with table [6]', () => {
    // Select only table [6] → 7 cards × 3 rounds = 21 total questions
    startGameModeWithTable6('start-three-rounds')

    // Progress shows "1 / 21" (7 cards × 3 rounds)
    cy.get('[data-cy="card-counter"]').should('contain', '1 / 21')

    // Answer all 21 questions correctly
    playThroughAndVerifyGameOver(21, answerCurrentCardCorrectly)
  })
})
