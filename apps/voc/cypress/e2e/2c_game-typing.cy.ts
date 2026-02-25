import { getCardsFromStorage } from '../support/commands'
import { seedTestCards, TEST_CARD_COUNT } from '../support/test-helpers'

describe('VOC Typing Mode Game - DE to Voc', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/', {
      onBeforeLoad(win) {
        seedTestCards(win)
      }
    })
  })

  /**
   * Answer a typing card with a specific answer strategy.
   * @param strategy - 'correct' | 'wrong' | 'close'
   */
  const answerTypingCard = (strategy: 'correct' | 'wrong' | 'close') => {
    cy.window().then(win => {
      const cards = getCardsFromStorage(win)
      cy.get('[data-cy="question-display"]')
        .invoke('text')
        .then(questionText => {
          const card = cards.find(c => c.de === questionText.trim())
          let answerToType: string

          if (strategy === 'wrong') {
            answerToType = 'xxx wrong answer'
          } else if (strategy === 'close' && card) {
            const correctAnswer = card.voc.split('/')[0].trim()
            answerToType = `x${correctAnswer.substring(1)}`
          } else {
            answerToType = card ? card.voc.split('/')[0].trim() : 'test'
          }

          cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')
          cy.get('[data-cy="answer-input"]').clear()
          cy.get('[data-cy="answer-input"]').type(answerToType)
          cy.get('[data-cy="submit-answer-button"]').click()

          cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
          cy.get('body').then($body => {
            // cspell:disable-next-line
            if ($body.text().includes('Falsch') || $body.text().includes('Fast richtig')) {
              cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled')
            }
          })
          cy.get('[data-cy="continue-button"]').click()
        })
    })
  }

  it('should complete a game with 1 wrong, 1 close, and remaining correct answers', () => {
    // cspell:disable-next-line
    cy.contains('Schreiben').click()
    cy.contains('DE → Voc').click()
    cy.get('[data-cy="start-button"]').click()

    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')

    answerTypingCard('wrong')
    answerTypingCard('close')
    for (let i = 2; i < TEST_CARD_COUNT; i++) {
      answerTypingCard('correct')
    }

    cy.url({ timeout: 15000 }).should('include', '/game-over')

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        const count = Number.parseInt(text.trim(), 10)
        expect(count)
          .to.be.at.least(TEST_CARD_COUNT - 2)
          .and.at.most(TEST_CARD_COUNT - 1)
      })
    cy.get('[data-cy="total-questions-count"]').should('contain', String(TEST_CARD_COUNT))

    let gameOverPoints = 0
    let gameOverCorrectAnswers = 0

    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        gameOverPoints = Number.parseInt(text.trim(), 10)
        expect(gameOverPoints).to.be.greaterThan(0)
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        gameOverCorrectAnswers = Number.parseInt(text.trim(), 10)
      })

    cy.get('[data-cy="back-to-home-button"]').click()
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Verify home page stats match
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="stats-games-played"]').should('contain', '1')

    // Verify history page stats match
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.get('[data-cy="history-game-0"]').should('be.visible')

    cy.get('[data-cy="history-game-0-correct"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="history-game-0-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="back-button"]').click()
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
