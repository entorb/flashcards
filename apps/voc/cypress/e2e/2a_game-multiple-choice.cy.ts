import { getCardsFromStorage } from '../support/commands'

describe('VOC Multiple Choice Game - Voc to DE', () => {
  beforeEach(() => {
    // Clear storage to ensure clean state
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should complete a game with 1 wrong and 9 correct answers', () => {
    // Select Multiple Choice mode
    cy.contains('Multiple Choice').click()

    // Select Voc → DE language direction
    cy.contains('Voc → DE').click()

    // Start the game
    cy.get('[data-cy="start-button"]').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')

    // Wait for question to be visible
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Wait for multiple choice options to appear (first card initialization)
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    // Helper function to answer a card
    const answerCard = (cardIndex: number) => {
      // Get the question text and cards from localStorage
      cy.window().then(win => {
        const cards = getCardsFromStorage(win)

        cy.get('[data-cy="question-display"]')
          .invoke('text')
          .then(questionText => {
            if (cardIndex === 0) {
              // First card: answer incorrectly
              // Find the correct answer first, then click a different button
              const card = cards.find((c: any) => c.voc === questionText.trim())
              if (card) {
                const correctAnswer = card.de

                // Find all buttons and identify which is correct
                cy.get('[data-cy="multiple-choice-option"]').then($buttons => {
                  let correctIndex = -1
                  $buttons.each((index, btn) => {
                    if (btn.textContent?.trim() === correctAnswer) {
                      correctIndex = index
                      return false // Break
                    }
                  })

                  // Click a wrong button (not the correct one)
                  // If correct is at index 0, click index 1, otherwise click index 0
                  const wrongIndex = correctIndex === 0 ? 1 : 0
                  cy.get('[data-cy="multiple-choice-option"]').eq(wrongIndex).click()
                })
              } else {
                // Fallback: click first option
                cy.get('[data-cy="multiple-choice-option"]').eq(0).click()
              }
            } else {
              // Remaining cards: answer correctly
              const card = cards.find((c: any) => c.voc === questionText.trim())

              if (card) {
                // Match against full card.de value (includes alternatives like "Welche/Welcher/Welches")
                const correctAnswer = card.de

                // Find the index of the correct answer button
                cy.get('[data-cy="multiple-choice-option"]').then($buttons => {
                  let correctIndex = -1
                  $buttons.each((index, btn) => {
                    if (btn.textContent?.trim() === correctAnswer) {
                      correctIndex = index
                      return false // Break
                    }
                  })

                  // Click the correct answer
                  if (correctIndex >= 0) {
                    cy.get('[data-cy="multiple-choice-option"]').eq(correctIndex).click()
                  } else {
                    // Fallback: click first option
                    cy.get('[data-cy="multiple-choice-option"]').eq(0).click()
                  }
                })
              } else {
                // Fallback: click first option
                cy.get('[data-cy="multiple-choice-option"]').eq(0).click()
              }
            }

            // Wait for feedback and continue button
            cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')

            // Check if wrong answer (wait for button to enable)
            cy.get('body').then($body => {
              if ($body.text().includes('Falsch') || $body.text().includes('Fast richtig')) {
                // Wait for button to be enabled
                cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled')
              }
            })

            // Click continue button
            cy.get('[data-cy="continue-button"]').click()
          })
      })
    }

    // Play through 10 cards: first card wrong, rest correct
    answerCard(0) // Card 0 - wrong answer
    for (let i = 1; i < 10; i++) {
      answerCard(i) // Cards 1-9 - correct answers
    }

    // After all cards, we should be on game over page
    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="back-to-home-button"]').should('be.visible')

    // Should have exactly 9 correct answers (cards 1-9)
    cy.get('[data-cy="correct-answers-count"]').should('contain', '9')
    cy.get('[data-cy="total-questions-count"]').should('contain', '10')

    // Capture exact values from GameOverPage
    let gameOverPoints: number
    let gameOverCorrectAnswers: number

    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        gameOverPoints = Number.parseInt(text.trim())
        cy.log('GameOver Points:', gameOverPoints)
        expect(gameOverPoints).to.greaterThan(1)
      })

    cy.get('[data-cy="correct-answers-count"]')
      .invoke('text')
      .then(text => {
        gameOverCorrectAnswers = Number.parseInt(text.trim())
        cy.log('GameOver Correct Answers:', gameOverCorrectAnswers)
        expect(gameOverCorrectAnswers).to.equal(9)
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
        const homePagePoints = Number.parseInt(text.trim())
        cy.log('HomePage Points:', homePagePoints)
        expect(homePagePoints).to.equal(gameOverPoints)
      })

    cy.get('[data-cy="stats-correct-answers"]')
      .invoke('text')
      .then(text => {
        const homePageCorrectAnswers = Number.parseInt(text.trim())
        cy.log('HomePage Correct Answers:', homePageCorrectAnswers)
        expect(homePageCorrectAnswers).to.equal(gameOverCorrectAnswers)
      })

    // Verify gamesPlayed incremented to 1
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')

    // Navigate to history page
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.get('[data-cy="history-page-title"]').should('be.visible')

    // Verify the most recent game appears in history
    cy.get('[data-cy="history-game-0"]').should('be.visible')

    // Verify exact correct answers and points in history
    cy.get('[data-cy="history-game-0-correct"]')
      .invoke('text')
      .then(text => {
        const historyCorrectAnswers = Number.parseInt(text.trim())
        cy.log('History Correct Answers:', historyCorrectAnswers)
        expect(historyCorrectAnswers).to.equal(gameOverCorrectAnswers)
      })

    cy.get('[data-cy="history-game-0-points"]')
      .invoke('text')
      .then(text => {
        const historyPoints = Number.parseInt(text.trim())
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
    // Verify we're on home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Verify initial stats are zero
    cy.get('[data-cy="stats-games-played"]').should('contain', '0')
    cy.get('[data-cy="stats-total-points"]').should('contain', '0')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '0')

    // Helper function to play a complete game
    const playGame = (correctCount: number) => {
      // Answer cards: all correct
      for (let cardIndex = 0; cardIndex < 10; cardIndex++) {
        cy.window().then(win => {
          const cards = getCardsFromStorage(win)

          cy.get('[data-cy="question-display"]')
            .invoke('text')
            .then(questionText => {
              const card = cards.find((c: any) => c.voc === questionText.trim())
              if (card && cardIndex < correctCount) {
                // Answer correctly
                const correctAnswer = card.de
                cy.get('[data-cy="multiple-choice-option"]').then($buttons => {
                  let correctIndex = -1
                  $buttons.each((index, btn) => {
                    if (btn.textContent?.trim() === correctAnswer) {
                      correctIndex = index
                      return false
                    }
                  })
                  if (correctIndex >= 0) {
                    cy.get('[data-cy="multiple-choice-option"]').eq(correctIndex).click()
                  }
                })
              } else {
                // Answer incorrectly (for cards beyond correctCount)
                cy.get('[data-cy="multiple-choice-option"]').eq(0).click()
              }

              cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('be.visible')
              cy.get('body').then($body => {
                if ($body.text().includes('Falsch')) {
                  // Wait for button to be enabled
                  cy.get('[data-cy="continue-button"]', { timeout: 5000 }).should('not.be.disabled')
                }
              })
              cy.get('[data-cy="continue-button"]').click()
            })
        })
      }
    }

    // Play first game
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    playGame(10) // All 10 correct

    // Verify on game over page
    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="correct-answers-count"]').should('contain', '10')

    // Capture stats from first game
    let game1Points: number
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game1Points = Number.parseInt(text.trim())
      })

    // Go back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.url().should('not.include', '/game-over')

    // Verify stats incremented after first game
    cy.get('[data-cy="stats-games-played"]').should('contain', '1')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '10')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        expect(Number.parseInt(text.trim(), 10)).to.equal(game1Points)
      })

    // Reset all cards to level 1 before second game
    cy.window().then(win => {
      const cards = getCardsFromStorage(win)
      const resetCards = cards.map((card: any) => ({ ...card, level: 1 }))
      win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: resetCards }]))
    })

    // Reload page to apply reset and re-enable multiple choice mode
    cy.reload()
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Play second game - now multiple choice should be available
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Verify game starts fresh at 1/10 (not 11/10 or corrupted state)
    cy.get('[data-cy="card-counter"]').should('contain', '1 / 10')

    // Wait for multiple choice options to appear
    cy.get('[data-cy="multiple-choice-option"]', { timeout: 10000 }).should('have.length', 4)

    // Play through 10 cards with correct answers using the playGame helper
    playGame(10)

    // Verify on game over page
    cy.url({ timeout: 15000 }).should('include', '/game-over')
    cy.get('[data-cy="correct-answers-count"]').should('contain', '10')

    // Capture stats from second game
    let game2Points: number
    cy.get('[data-cy="final-points"]')
      .invoke('text')
      .then(text => {
        game2Points = Number.parseInt(text.trim(), 10)
      })

    // Go back to home
    cy.get('[data-cy="back-to-home-button"]').click()
    cy.url().should('not.include', '/game-over')

    // Verify stats incremented after second game
    cy.get('[data-cy="stats-games-played"]').should('contain', '2')
    cy.get('[data-cy="stats-correct-answers"]').should('contain', '20')
    cy.get('[data-cy="stats-total-points"]')
      .invoke('text')
      .then(text => {
        const totalPoints = Number.parseInt(text.trim(), 10)
        // Total should be sum of both games
        expect(totalPoints).to.be.greaterThan(game1Points)
        expect(totalPoints).to.be.greaterThan(game2Points)
      })
  })
})
