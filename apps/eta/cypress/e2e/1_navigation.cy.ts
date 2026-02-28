describe('ETA Navigation Smoke Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('navigate Home to Info and back', () => {
    // Verify we're on the config (home) view
    cy.get('[data-cy="input-total-tasks"]').should('be.visible')

    // Navigate to Info page
    cy.get('[data-cy="info-button"]').should('be.visible')
    cy.get('[data-cy="info-button"]').click()
    cy.get('[data-cy="info-page-title"]').should('be.visible')

    // Navigate back via back button
    cy.get('[data-cy="back-button"]').click()
    cy.get('[data-cy="input-total-tasks"]').should('be.visible')
  })
})
