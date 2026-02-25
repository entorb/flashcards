describe('1x1 Game Modes', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  const parseQuestion = (questionText: string): { x: number; y: number; answer: number } => {
    const regex = /(\d+)\s*×\s*(\d+)/
    const match = regex.exec(questionText)
    if (!match) throw new Error(`Could not parse question: ${questionText}`)
    const x = Number.parseInt(match[1], 10)
    const y = Number.parseInt(match[2], 10)
    return { x, y, answer: x * y }
  }

  /**
   * Answer the current question correctly:
   * read the question, type the answer, wait for green feedback, press Enter.
   */
  function answerCurrentCardCorrectly() {
    cy.get('[data-cy="question-display"]')
      .invoke('text')
      .then(questionText => {
        const { answer } = parseQuestion(questionText)
        cy.get('[data-cy="answer-input"]').clear()
        cy.get('[data-cy="answer-input"]').type(String(answer))
        cy.get('[data-cy="correct-answer-feedback"]', { timeout: 5000 }).should('be.visible')
        cy.get('body').type('{enter}')
      })
  }

  describe('Endless Level 1 mode', () => {
    it('should play a complete Endless Level 1 game with table [6]', () => {
      // Select only table [6] → 7 cards (3×6 through 9×6), all Level 1 in fresh state
      cy.get('[data-cy="table-selection-button-6"]').click()

      // Endless Level 1 button should be enabled (fresh cards are all Level 1)
      cy.get('[data-cy="start-endless-level1"]').should('not.be.disabled')

      // Start Endless Level 1 mode
      cy.get('[data-cy="start-endless-level1"]').click()

      // Verify we're on the game page
      cy.url().should('include', '/game')
      cy.get('[data-cy="question-display"]').should('be.visible')

      // Verify progress indicator shows remaining count (7 cards, no "X / Y" format)
      cy.get('[data-cy="card-counter"]').should('contain', '7')

      // Answer all 7 cards correctly — each correct answer removes a card
      for (let i = 0; i < 7; i++) {
        answerCurrentCardCorrectly()
      }

      // After all cards answered correctly, should reach game-over page
      cy.url({ timeout: 10000 }).should('include', '/game-over')
      cy.get('[data-cy="back-to-home-button"]').should('be.visible')

      // Verify correct answers count
      cy.get('[data-cy="correct-answers-count"]').should('contain', '7')

      // Navigate back to home
      cy.get('[data-cy="back-to-home-button"]').click()
      cy.get('[data-cy="app-title"]').should('be.visible')
    })
  })

  describe('3 Rounds mode', () => {
    it('should play a complete 3 Rounds game with table [6]', () => {
      // Select only table [6] → 7 cards × 3 rounds = 21 total questions
      cy.get('[data-cy="table-selection-button-6"]').click()

      // 3 Rounds button should be enabled
      cy.get('[data-cy="start-three-rounds"]').should('not.be.disabled')

      // Start 3 Rounds mode
      cy.get('[data-cy="start-three-rounds"]').click()

      // Verify we're on the game page
      cy.url().should('include', '/game')
      cy.get('[data-cy="question-display"]').should('be.visible')

      // Verify progress indicator shows "1 / 21" (7 cards × 3 rounds)
      cy.get('[data-cy="card-counter"]').should('contain', '1 / 21')

      // Answer all 21 questions correctly
      for (let i = 0; i < 21; i++) {
        answerCurrentCardCorrectly()
      }

      // After all questions, should reach game-over page
      cy.url({ timeout: 10000 }).should('include', '/game-over')
      cy.get('[data-cy="back-to-home-button"]').should('be.visible')

      // Verify correct answers count = 21
      cy.get('[data-cy="correct-answers-count"]').should('contain', '21')

      // Navigate back to home
      cy.get('[data-cy="back-to-home-button"]').click()
      cy.get('[data-cy="app-title"]').should('be.visible')
    })
  })
})
