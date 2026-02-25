import {
  answerCopyCard,
  seedTestCards,
  verifyPostGameStats,
  TEST_CARD_COUNT
} from '../support/test-helpers'

describe('LWK Copy Mode Game', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        seedTestCards(win)
      }
    })
  })

  it('should complete a game with 1 wrong and remaining correct answers', () => {
    cy.get('[data-cy="mode-option-copy"]').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    answerCopyCard(false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      answerCopyCard(true)
    }

    verifyPostGameStats(TEST_CARD_COUNT - 1)
  })
})
