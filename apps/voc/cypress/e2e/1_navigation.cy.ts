describe('Navigation Smoke Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('navigate Home to History and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate to History
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.get('[data-cy="history-page-title"]').should('be.visible')

    // Test page reload persistence
    cy.reload()
    cy.get('[data-cy="history-page-title"]').should('be.visible')

    // Test back via button
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for browser back test
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.go('back')
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('navigate Home to Cards and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate to Cards
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="reset-levels-button"]').should('be.visible')

    // Test page reload persistence
    cy.reload()
    cy.get('[data-cy="reset-levels-button"]').should('be.visible')

    // Test back via button
    cy.get('[data-cy="back-button"]').first().click()
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for browser back test
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.go('back')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('navigate Cards to CardsEdit and back to Home', () => {
    // Navigate to Cards first
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')

    // Navigate to CardsEdit
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]').should('be.visible')

    // Test back via button goes directly to Home
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('not.include', '/cards-edit')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/cards-edit')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('navigate Cards to DecksEdit and back to Home', () => {
    // Navigate to Cards first
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')

    // Navigate to DecksEdit
    cy.get('[data-cy="edit-decks-button"]').click()
    cy.url().should('include', '/decks-edit')
    cy.get('[data-cy="add-deck-button"]').should('be.visible')

    // Test back via button goes directly to Home
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('not.include', '/decks-edit')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()
    cy.url().should('include', '/decks-edit')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/decks-edit')
    cy.url().should('not.include', '/cards')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('navigate Home to Game and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Initialize game settings by selecting mode and language
    cy.contains('Multiple Choice').click()
    cy.contains('Voc → DE').click()

    // Navigate to Game
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    // Wait for game page to load properly
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Test page reload persistence
    cy.reload()
    cy.get('[data-cy="question-display"]', { timeout: 10000 }).should('be.visible')

    // Test back via button
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('not.include', '/game')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for browser back test
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.go('back')
    cy.url().should('not.include', '/game')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/game')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })

  it('navigate Home to Info and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate to Info
    cy.get('[data-cy="info-button"]').click()
    cy.url().should('include', '/info')
    cy.get('[data-cy="info-page-title"]').should('be.visible')

    // Test page reload persistence
    cy.reload()
    cy.get('[data-cy="info-page-title"]').should('be.visible')

    // Test back via button
    cy.get('[data-cy="back-button"]').first().click()
    cy.url().should('not.include', '/info')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for browser back test
    cy.get('[data-cy="info-button"]').click()
    cy.url().should('include', '/info')
    cy.go('back')
    cy.url().should('not.include', '/info')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="info-button"]').click()
    cy.url().should('include', '/info')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/info')
    cy.get('[data-cy="app-title"]').should('be.visible')
  })
})
