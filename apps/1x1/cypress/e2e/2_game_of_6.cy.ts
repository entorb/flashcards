describe('Full Game Flow', () => {
  beforeEach(() => {
    // Clear localStorage before visiting the page
    indexedDB.deleteDatabase('1x1')
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  // Helper function to parse question and calculate answer
  const parseQuestion = (questionText: string): { x: number; y: number; answer: number } => {
    const match = questionText.match(/(\d+)\s*×\s*(\d+)/)
    if (!match) throw new Error(`Could not parse question: ${questionText}`)
    const x = parseInt(match[1])
    const y = parseInt(match[2])
    return { x, y, answer: x * y }
  }

  it('should play a complete game with 1 wrong and 6 correct answers', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Select only [6] - since all are selected by default, clicking 6 will select only 6
    cy.get('[data-cy="table-selection-button-6"]').click()

    // Verify only 6 is selected (it should be filled/unelevated)
    cy.get('[data-cy="table-selection-button-6"]').should('have.class', 'q-btn--unelevated')

    // Start the game
    cy.get('[data-cy="start-button"]').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')

    // Wait for game to load
    cy.get('[data-cy="question-display"]').should('be.visible')

    // Answer first question WRONG
    cy.get('[data-cy="question-display"]')
      .invoke('text')
      .then(questionText => {
        const { answer } = parseQuestion(questionText)
        const wrongAnswer = answer + 1 // Wrong answer

        cy.get('[data-cy="answer-input"]').clear()
        cy.get('[data-cy="answer-input"]').type(String(wrongAnswer))

        // Auto-submit happens after typing expected answer length, wait for wrong answer feedback (red dialog)
        cy.get('[data-cy="wrong-answer-feedback"]', { timeout: 5000 }).should('be.visible')

        // Wait for button to be enabled (3 second disable timer)
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3100)

        // Click continue to next question
        cy.get('[data-cy="continue-button"]').click()
      })

    // Answer next 6 questions CORRECTLY
    for (let i = 0; i < 6; i++) {
      cy.get('[data-cy="question-display"]')
        .invoke('text')
        .then(questionText => {
          const { answer } = parseQuestion(questionText)

          cy.get('[data-cy="answer-input"]').clear()
          cy.get('[data-cy="answer-input"]').type(String(answer))

          // Wait for auto-submit after typing expected answer length or feedback to appear (green dialog)
          cy.get('[data-cy="correct-answer-feedback"]', { timeout: 5000 }).should('be.visible')

          // Wait for auto-close or press Enter to continue
          // For correct answers, it auto-closes after 3s, but we can skip with Enter
          cy.get('body').type('{enter}')
        })
    }

    // After all questions, should be on game over page
    cy.url({ timeout: 10000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    // Verify statistics show 6 correct answers out of 7 total
    cy.get('[data-cy="correct-answers-count"]').should('contain', '6')
    cy.get('[data-cy="total-questions-count"]').should('contain', '7')

    // Capture exact values from GameOverPage
    let gameOverPoints: number
    let gameOverCorrectAnswers: number

    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        gameOverPoints = parseInt(text.trim())
        cy.log('GameOver Points:', gameOverPoints)
        expect(gameOverPoints).to.greaterThan(1)
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        gameOverCorrectAnswers = parseInt(text.trim())
        cy.log('GameOver Correct Answers:', gameOverCorrectAnswers)
        expect(gameOverCorrectAnswers).to.equal(6)
      })

    // Navigate back to home
    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify we're back on home page
    cy.url().should('not.include', '/game-over')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Verify exact points and correct answers match on HomePage
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const homePagePoints = parseInt(text.trim())
        cy.log('HomePage Points:', homePagePoints)
        expect(homePagePoints).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        const homePageCorrectAnswers = parseInt(text.trim())
        cy.log('HomePage Correct Answers:', homePageCorrectAnswers)
        expect(homePageCorrectAnswers).to.equal(gameOverCorrectAnswers)
      })

    // Verify gamesPlayed incremented to 1
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')

    // Navigate to history page
    cy.get('[data-cy="history-button"]').click()

    // Verify we're on history page
    cy.url().should('include', '/history')
    cy.get('[data-cy="history-page-title"]').should('be.visible')

    // Verify the most recent game appears in history (index 0 since sorted by date DESC)
    cy.get('[data-cy="history-game-0"]', { timeout: 5000 }).should('be.visible')

    // Verify exact correct answers and points in history match GameOverPage
    cy.get('[data-cy="history-game-0-correct"]')
      .invoke('text')
      .then(text => {
        const historyCorrectAnswers = parseInt(text.trim())
        cy.log('History Correct Answers:', historyCorrectAnswers)
        expect(historyCorrectAnswers).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="history-game-0-points"]')
      .invoke('text')
      .then(text => {
        const historyPoints = parseInt(text.trim())
        cy.log('History Points:', historyPoints)
        expect(historyPoints).to.equal(gameOverPoints)
      })

    // Navigate back to home
    cy.get('[data-cy="back-button"]').click()

    // Verify we're back on home page
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('should correctly increment stats and reset state across multiple games', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Verify initial stats are zero
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Play first game - select only [3]
    cy.get('[data-cy="table-selection-button-3"]').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')

    // Answer all 7 questions correctly in first game
    for (let i = 0; i < 7; i++) {
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

    // Verify on game over page
    cy.url({ timeout: 10000 }).should('include', '/game-over')

    // Capture stats from first game
    let game1Points: number
    let game1CorrectAnswers: number
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game1Points = parseInt(text.trim())
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        game1CorrectAnswers = parseInt(text.trim())
        expect(game1CorrectAnswers).to.equal(7)
      })

    // Go back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.url().should('not.include', '/game-over')

    // Verify stats incremented after first game
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '7')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(parseInt(text.trim())).to.equal(game1Points)
      })

    // Play second game - select only [4]
    cy.get('[data-cy="table-selection-button-4"]').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')

    // Verify game starts fresh at 1/7 (not 8/7 or corrupted state)
    cy.get('body').should('contain', '1')
    cy.get('body').should('contain', '7')

    // Answer all 7 questions correctly in second game
    for (let i = 0; i < 7; i++) {
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

    // Verify on game over page
    cy.url({ timeout: 10000 }).should('include', '/game-over')

    // Capture stats from second game
    let game2Points: number
    let game2CorrectAnswers: number
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game2Points = parseInt(text.trim())
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        game2CorrectAnswers = parseInt(text.trim())
        expect(game2CorrectAnswers).to.equal(7)
      })

    // Go back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.url().should('not.include', '/game-over')

    // Verify stats incremented after second game - should match sum of both games
    cy.get('[data-cy="stats-games-played"]').should('contain', '2')

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        const totalCorrectAnswers = parseInt(text.trim())
        const expectedCorrectAnswers = game1CorrectAnswers + game2CorrectAnswers
        expect(totalCorrectAnswers).to.equal(expectedCorrectAnswers)
      })

    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const totalPoints = parseInt(text.trim())
        const expectedTotalPoints = game1Points + game2Points
        expect(totalPoints).to.equal(expectedTotalPoints)
      })
  })
})
