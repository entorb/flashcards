import {
  answerCopyCardCorrectly,
  startCopyGameMode,
  playThroughAndVerifyGameOver,
  seedTestCards,
  TEST_CARD_COUNT
} from '../support/test-helpers'

describe('LWK Endless Level 1 mode', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        seedTestCards(win)
      }
    })
  })

  it('should complete game in copy mode', () => {
    startCopyGameMode('start-endless-level1')

    // All 4 test cards are at level 1
    cy.get('[data-cy="card-counter"]').should('contain', String(TEST_CARD_COUNT))

    playThroughAndVerifyGameOver(TEST_CARD_COUNT, answerCopyCardCorrectly)
  })
})
