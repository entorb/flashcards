import { getCardsFromStorage } from '../support/commands'

interface VocCard {
  voc: string
  de: string
  level: number
  time: number
}

describe('VOC Game Modes', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  /**
   * Answer the current card correctly in typing mode (voc-de direction):
   * read the question (voc field), find the matching card, type the de answer.
   */
  function answerCurrentCardCorrectly() {
    cy.window().then(win => {
      const cards = getCardsFromStorage(win) as VocCard[]
      cy.get('[data-cy="question-display"]')
        .invoke('text')
        .then(questionText => {
          const trimmed = questionText.trim()
          const card = cards.find((c: VocCard) => c.voc === trimmed)
          const correctAnswer = card ? card.de.split('/')[0].trim() : ''
          cy.get('[data-cy="answer-input"]').clear()
          cy.get('[data-cy="answer-input"]').type(correctAnswer)
          cy.get('[data-cy="submit-answer-button"]').click()
          cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
          cy.get('[data-cy="continue-button"]').click()
        })
    })
  }

  describe('Endless Level 1 mode', () => {
    it('should complete game in typing mode', () => {
      // Select typing mode
      // cspell:disable-next-line
      cy.contains('Schreiben').click()

      // Endless Level 1 button should be enabled (default deck has Level 1 cards)
      cy.get('[data-cy="start-endless-level1"]').should('not.be.disabled')

      // Start Endless Level 1 mode
      cy.get('[data-cy="start-endless-level1"]').click()

      // Verify we're on the game page
      cy.url().should('include', '/game')
      cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

      // Default deck has 2 Level 1 cards — progress shows remaining count only
      cy.get('[data-cy="card-counter"]').should('contain', '2')

      // Answer both Level 1 cards correctly
      answerCurrentCardCorrectly()
      answerCurrentCardCorrectly()

      // After all cards answered correctly, should reach game-over page
      cy.url({ timeout: 15000 }).should('include', '/game-over')
      cy.get('[data-cy="back-to-home-button"]').should('be.visible')

      // Verify correct answers count
      cy.get('[data-cy="correct-answers-count"]').should('contain', '2')

      // Navigate back to home
      cy.get('[data-cy="back-to-home-button"]').click()
      cy.get('[data-cy="app-title"]').should('be.visible')
    })
  })

  describe('3 Rounds mode', () => {
    it('should complete game in typing mode', () => {
      // Select typing mode
      // cspell:disable-next-line
      cy.contains('Schreiben').click()

      // 3 Rounds button should be enabled
      cy.get('[data-cy="start-three-rounds"]').should('not.be.disabled')

      // Start 3 Rounds mode
      cy.get('[data-cy="start-three-rounds"]').click()

      // Verify we're on the game page
      cy.url().should('include', '/game')
      cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

      // 10 cards × 3 rounds = 30 total questions
      cy.get('[data-cy="card-counter"]').should('contain', '1 / 30')

      // Answer all 30 questions correctly
      for (let i = 0; i < 30; i++) {
        answerCurrentCardCorrectly()
      }

      // After all questions, should reach game-over page
      cy.url({ timeout: 15000 }).should('include', '/game-over')
      cy.get('[data-cy="back-to-home-button"]').should('be.visible')

      // Verify correct answers count = 30
      cy.get('[data-cy="correct-answers-count"]').should('contain', '30')

      // Navigate back to home
      cy.get('[data-cy="back-to-home-button"]').click()
      cy.get('[data-cy="app-title"]').should('be.visible')
    })
  })
})
