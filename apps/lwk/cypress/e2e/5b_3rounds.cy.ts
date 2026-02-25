import {
  answerCopyCardCorrectly,
  startCopyGameMode,
  playThroughAndVerifyGameOver,
  seedTestCards,
  TEST_CARD_COUNT
} from '../support/test-helpers'

describe('LWK 3 Rounds mode', () => {
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
    startCopyGameMode('start-three-rounds')

    const totalQuestions = TEST_CARD_COUNT * 3
    cy.get('[data-cy="card-counter"]').should('contain', `1 / ${totalQuestions}`)

    playThroughAndVerifyGameOver(totalQuestions, answerCopyCardCorrectly)
  })
})
