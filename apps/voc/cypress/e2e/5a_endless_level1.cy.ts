import {
  answerCurrentCardCorrectly,
  startTypingGameMode,
  playThroughAndVerifyGameOver,
  seedTestCards
} from '../support/test-helpers'

describe('VOC Endless Level 1 mode', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        seedTestCards(win)
      }
    })
  })

  it('should complete game in typing mode', () => {
    startTypingGameMode('start-endless-level1')

    // All 4 test cards are at level 1
    cy.get('[data-cy="card-counter"]').should('contain', '4')

    playThroughAndVerifyGameOver(4, answerCurrentCardCorrectly)
  })
})
