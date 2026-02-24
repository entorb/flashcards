describe('1x1 Endless Level 5 mode', () => {
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

  it('should play a complete Endless Level 5 game with table [6]', () => {
    // Select only table [6] → 7 cards, all Level 1 in fresh state
    cy.get('[data-cy="table-selection-button-6"]').click()

    // Endless Level 5 button should be enabled (fresh cards are below level 5)
    cy.get('[data-cy="start-endless-level5"]').should('not.be.disabled')

    // Start Endless Level 5 mode
    cy.get('[data-cy="start-endless-level5"]').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Verify progress indicator shows remaining count (7 cards below level 5)
    cy.get('[data-cy="card-counter"]').should('contain', '7')

    // Each card needs 4 correct answers to go from level 1 → 5
    // 7 cards × 4 promotions = 28 total answers
    for (let i = 0; i < 28; i++) {
      answerCurrentCardCorrectly()
    }

    // After all cards reach level 5, should reach game-over page
    cy.url({ timeout: 10000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    // Verify correct answers count
    cy.get('[data-cy="correct-answers-count"]').should('contain', '28')

    // Navigate back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
