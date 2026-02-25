import {
  answerCopyCardCorrectly,
  startCopyGameMode,
  playThroughAndVerifyGameOver,
  seedTestCards
} from '../support/test-helpers'

describe('LWK Endless Level 5 mode', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        // Seed 4 cards with varying levels (all below level 5)
        seedTestCards(win, 2)
      }
    })
  })

  it('should complete game in copy mode', () => {
    startCopyGameMode('start-endless-level5')

    // 4 cards at level 2, each needs 3 promotions (2→3→4→5) = 12 answers
    cy.get('[data-cy="card-counter"]').should('contain', '4')

    playThroughAndVerifyGameOver(12, answerCopyCardCorrectly)
  })
})
