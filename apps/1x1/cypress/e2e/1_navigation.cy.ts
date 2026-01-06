describe('Navigation Smoke Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('navigate Home to History and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate to History - wait for button to be clickable
    cy.get('[data-cy="history-button"]').should('be.visible').and('not.be.disabled')
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
    cy.get('[data-cy="history-button"]').should('be.visible').and('not.be.disabled')
    cy.get('[data-cy="history-button"]').click()
    cy.url().should('include', '/history')
    cy.go('back')
    cy.url().should('not.include', '/history')
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate again for escape key test
    cy.get('[data-cy="history-button"]').should('be.visible').and('not.be.disabled')
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
    cy.get('[data-cy="back-button"]').click()
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

  it('navigate Home to Game and back', () => {
    // Verify we're on the home page
    cy.get('[data-cy="app-title"]').should('be.visible')

    // Navigate to Game
    cy.get('[data-cy="start-button"]').click()
    cy.url().should('include', '/game')
    cy.get('[data-cy="submit-answer-button"]').should('be.visible')

    // Test page reload persistence
    cy.reload()
    cy.get('[data-cy="submit-answer-button"]').should('be.visible')

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
})
