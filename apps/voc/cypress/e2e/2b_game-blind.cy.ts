import {
  answerBlindCard,
  verifyPostGameStats,
  seedTestCards,
  TEST_CARD_COUNT
} from '../support/test-helpers'

describe('VOC Blind Mode Game - DE to Voc', () => {
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
    cy.contains('Blind').click()
    cy.contains('DE → Voc').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    answerBlindCard(false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      answerBlindCard(true)
    }

    verifyPostGameStats(TEST_CARD_COUNT - 1, TEST_CARD_COUNT)
  })
})
