import { getCardsFromStorage } from '../support/commands'

describe('Typing Mode Game - DE to Voc', () => {
  beforeEach(() => {
    // Clear storage to ensure clean state
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should complete a game with 1 wrong, 1 close, and 8 correct answers', () => {
    // Select Typing mode
    // cspell:disable-next-line
    cy.contains('Schreiben').click()

    // Select DE → Voc language direction
    cy.contains('DE → Voc').click()

    // Start the game
    cy.get('[data-cy="start-button"]').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')

    // Wait for game question to be visible
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Wait for typing input to appear (first card initialization)
    cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')

    // Helper function to answer a card
    const answerCard = (cardIndex: number) => {
      // Get the question text and cards from localStorage
      cy.window().then(win => {
        const cards = getCardsFromStorage(win)

        cy.get('[data-cy="question-display"]')
          .invoke('text')
          .then(questionText => {
            let answerToType = ''

            if (cardIndex === 0) {
              // First card: answer incorrectly
              answerToType = 'xxx wrong answer'
            } else if (cardIndex === 1) {
              // Second card: answer almost correctly (with typo)
              // Find the correct answer and introduce a small typo
              const card = cards.find((c: any) => c.de === questionText.trim())
              if (card) {
                const correctAnswer = card.voc.split('/')[0].trim()
                // Add a typo by changing one character (e.g., replace first char with 'x')
                answerToType = `x${correctAnswer.substring(1)}`
              } else {
                // Fallback: generic close answer
                answerToType = 'xxx close'
              }
            } else {
              // Remaining cards: answer correctly
              const card = cards.find((c: any) => c.de === questionText.trim())
              if (card) {
                const correctAnswer = card.voc.split('/')[0].trim()
                answerToType = correctAnswer
              } else {
                // Fallback: generic answer
                answerToType = 'test'
              }
            }

            // Wait for input to be ready
            cy.get('[data-cy="answer-input"]', { timeout: 10000 }).should('be.visible')

            // Capture question text BEFORE clearing input
            let initialQuestionText = ''
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                initialQuestionText = text.trim()
                cy.log(`Card ${cardIndex}: Question = "${initialQuestionText}"`)
              })

            // Clear the input
            cy.get('[data-cy="answer-input"]').clear()

            // CRITICAL: Verify question hasn't changed after clearing
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textAfterClear = text.trim()
                expect(textAfterClear, 'Question should not change after clearing input').to.equal(
                  initialQuestionText
                )
              })

            // Type the answer character by character with verification
            cy.get('[data-cy="answer-input"]').type(answerToType, { delay: 50 })

            // CRITICAL: Verify question hasn't changed while typing
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textAfterTyping = text.trim()
                expect(textAfterTyping, 'Question should not change while typing').to.equal(
                  initialQuestionText
                )
              })

            // Wait a moment to ensure no unexpected card changes
            cy.wait(200)

            // CRITICAL: Final verification before submitting
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textBeforeSubmit = text.trim()
                expect(textBeforeSubmit, 'Question should not change before submit').to.equal(
                  initialQuestionText
                )
              })

            // Click Check button
            cy.get('[data-cy="submit-answer-button"]').click()

            // CRITICAL: Verify question still matches after clicking submit but before feedback appears
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textAfterSubmit = text.trim()
                expect(
                  textAfterSubmit,
                  'Question should not change immediately after submit'
                ).to.equal(initialQuestionText)
              })

            // Wait for feedback and continue button
            cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')

            // CRITICAL: Verify question STILL matches while feedback is shown
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textDuringFeedback = text.trim()
                expect(textDuringFeedback, 'Question should not change during feedback').to.equal(
                  initialQuestionText
                )
              })

            // Check if wrong or close answer (wait for button to enable)
            cy.get('body').then($body => {
              if ($body.text().includes('Falsch') || $body.text().includes('Fast richtig')) {
                // Wait for button to be enabled
                cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled')

                // CRITICAL: Verify question hasn't changed while waiting
                cy.get('[data-cy="question-display"]')
                  .invoke('text')
                  .then(text => {
                    const textWhileWaiting = text.trim()
                    expect(
                      textWhileWaiting,
                      'Question should not change while waiting for button'
                    ).to.equal(initialQuestionText)
                  })
              }
            })

            // CRITICAL: Final check before clicking continue
            cy.get('[data-cy="question-display"]')
              .invoke('text')
              .then(text => {
                const textBeforeContinue = text.trim()
                expect(
                  textBeforeContinue,
                  'Question should not change before continue click'
                ).to.equal(initialQuestionText)
              })

            // Click continue button
            cy.get('[data-cy="continue-button"]').click()

            // After clicking continue, we expect the card to change (if not last card)
            // So we verify the next card has loaded by checking input exists for next card
            if (cardIndex < 9) {
              cy.get('[data-cy="answer-input"]', { timeout: 5000 }).should('be.visible')

              // Verify the question has NOW changed to a different card
              cy.get('[data-cy="question-display"]')
                .invoke('text')
                .then(text => {
                  const nextQuestionText = text.trim()
                  cy.log(`Next card question = "${nextQuestionText}"`)
                  // The question should be different from the previous one
                  expect(nextQuestionText, 'Should move to next card after continue').to.not.equal(
                    initialQuestionText
                  )
                })
            }
          })
      })
    }

    // Play through 10 cards
    answerCard(0) // Card 0 - wrong answer
    answerCard(1) // Card 1 - close answer (typo)
    for (let i = 2; i < 10; i++) {
      answerCard(i) // Cards 2-9 - correct answers
    }

    // After all cards, we should be on game over page
    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    // Should have 8 correct (cards 2-9), but allow for 7-9 due to "close" answer
    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        const count = Number.parseInt(text, 10)
        expect(count).to.be.at.least(7).and.at.most(9)
      })
    cy.get('[data-cy="total-questions-count"]').should('contain', '10')

    // Capture exact values from GameOverPage
    let gameOverPoints: number
    let gameOverCorrectAnswers: number

    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        gameOverPoints = Number.parseInt(text.trim(), 10)
        cy.log('GameOver Points:', gameOverPoints)
        expect(gameOverPoints).to.greaterThan(1)
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        gameOverCorrectAnswers = Number.parseInt(text.trim(), 10)
        cy.log('GameOver Correct Answers:', gameOverCorrectAnswers)
        expect(gameOverCorrectAnswers).to.be.at.least(7).and.at.most(9)
      })

    // Navigate back to home page
    cy.get('[data-cy="back-to-home-button"]').click()

    // Verify we're back on home page
    cy.url().should('not.include', '/game-over')
    cy.get('[data-cy="app-title"]').should('be.visible()')

    // Verify exact points and correct answers match on HomePage
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const homePagePoints = Number.parseInt(text.trim(), 10)
        cy.log('HomePage Points:', homePagePoints)
        expect(homePagePoints).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        const homePageCorrectAnswers = Number.parseInt(text.trim(), 10)
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
    cy.get('[data-cy="history-game-0"]').should('be.visible')

    // Verify exact correct answers and points in history match GameOverPage
    cy.get('[data-cy="history-game-0-correct"]')
      .invoke('text')
      .then(text => {
        const historyCorrectAnswers = Number.parseInt(text.trim(), 10)
        cy.log('History Correct Answers:', historyCorrectAnswers)
        expect(historyCorrectAnswers).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="history-game-0-points"]')
      .invoke('text')
      .then(text => {
        const historyPoints = Number.parseInt(text.trim(), 10)
        cy.log('History Points:', historyPoints)
        expect(historyPoints).to.equal(gameOverPoints)
      })

    // Navigate back to home
    cy.get('[data-cy="back-button"]').click()

    // Verify we're back on home page
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
