// Shared test utilities for 1x1 Cypress tests

/**
 * Parse a multiplication question like "3 × 4" and return the factors and answer.
 */
export const parseQuestion = (questionText: string): { x: number; y: number; answer: number } => {
  const regex = /(\d+)\s*×\s*(\d+)/
  const match = regex.exec(questionText)
  if (!match) throw new Error(`Could not parse question: ${questionText}`)
  const x = Number.parseInt(match[1], 10)
  const y = Number.parseInt(match[2], 10)
  return { x, y, answer: x * y }
}

/**
 * Answer the current question incorrectly:
 * read the question, type wrong answer, wait for red feedback, click continue.
 */
export const answerCurrentCardWrong = (): void => {
  cy.get('[data-cy="question-display"]')
    .invoke('text')
    .then(questionText => {
      const { answer } = parseQuestion(questionText)
      cy.get('[data-cy="answer-input"]').clear()
      cy.get('[data-cy="answer-input"]').type(String(answer + 1))
      cy.get('[data-cy="wrong-answer-feedback"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled').click()
    })
}

/**
 * Answer the current question correctly:
 * read the question, type the answer, wait for green feedback, press Enter.
 */
export const answerCurrentCardCorrectly = (): void => {
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

/**
 * Start a game mode after selecting table [6].
 */
export const startGameModeWithTable6 = (buttonCy: string): void => {
  cy.get('[data-cy="table-selection-button-6"]').click()
  cy.get(`[data-cy="${buttonCy}"]`).should('not.be.disabled')
  cy.get(`[data-cy="${buttonCy}"]`).click()
  cy.url().should('include', '/game')
  cy.get('[data-cy="question-display"]').should('be.visible')
}

/**
 * Play through all cards, verify game-over with correct count, then navigate home.
 */
export const playThroughAndVerifyGameOver = (totalCards: number, answerFn: () => void): void => {
  for (let i = 0; i < totalCards; i++) {
    answerFn()
  }
  cy.url({ timeout: 10000 }).should('include', '/game-over')
  cy.get('[data-cy="correct-answers-count"]').should('contain', String(totalCards))
  cy.get('[data-cy="back-to-home-button"]').click()
  cy.get('[data-cy="app-title"]').should('be.visible')
}

/**
 * Verify game-over stats, then check home page and history page match.
 */
export const verifyPostGameStats = (expectedCorrect: number, expectedTotal: number): void => {
  cy.url({ timeout: 10000 }).should('include', '/game-over')

  let gameOverPoints = 0
  let gameOverCorrectAnswers = 0

  cy.get('[data-cy="correct-answers-count"]').should('contain', String(expectedCorrect))
  cy.get('[data-cy="total-questions-count"]').should('contain', String(expectedTotal))

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
      expect(gameOverCorrectAnswers).to.equal(expectedCorrect)
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
  cy.get('[data-cy="history-game-0"]', { timeout: 5000 }).should('be.visible')

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
}
