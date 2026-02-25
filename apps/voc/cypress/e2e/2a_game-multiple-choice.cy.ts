import { getCardsFromStorage } from '../support/commands'
import {
  answerMultipleChoiceCard,
  verifyPostGameStats,
  seedTestCards,
  TEST_CARD_COUNT
} from '../support/test-helpers'

describe('VOC Multiple Choice Game - Voc to DE', () => {
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
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    answerMultipleChoiceCard(false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      answerMultipleChoiceCard(true)
    }

    verifyPostGameStats(TEST_CARD_COUNT - 1, TEST_CARD_COUNT)
  })

  it('should correctly increment stats and reset state across multiple games', () => {
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Play first game — all correct
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    for (let i = 0; i < TEST_CARD_COUNT; i++) {
      answerMultipleChoiceCard(true)
    }

    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="correct-answers-count"]').should('contain', String(TEST_CARD_COUNT))

    let game1Points = 0
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game1Points = Number.parseInt(text.trim(), 10)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', String(TEST_CARD_COUNT))
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points)
      })

    // Reset cards to level 1 before second game
    cy.window().then(win => {
      const cards = getCardsFromStorage(win)
      const resetCards = cards.map(card => ({ ...card, level: 1 }))
      win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: resetCards }]))
    })
    cy.reload()

    // Play second game
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="card-counter"]').should('contain', `1 / ${TEST_CARD_COUNT}`)
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    for (let i = 0; i < TEST_CARD_COUNT; i++) {
      answerMultipleChoiceCard(true)
    }

    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="correct-answers-count"]').should('contain', String(TEST_CARD_COUNT))

    let game2Points = 0
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game2Points = Number.parseInt(text.trim(), 10)
      })

    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify cumulative stats
    cy.get('[data-cy="stats-games-played"]').should('contain', '2')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', String(TEST_CARD_COUNT * 2))
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const totalPoints = Number.parseInt(text.trim(), 10)
        expect(totalPoints).to.be.greaterThan(game1Points)
        expect(totalPoints).to.be.greaterThan(game2Points)
      })
  })
})
