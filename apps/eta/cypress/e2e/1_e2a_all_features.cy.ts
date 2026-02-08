describe('ETA Tracking Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('complete tracking workflow with 10 tasks', () => {
    // Wait for config view to be visible
    cy.get('[data-cy="input-total-tasks"]').should('be.visible')

    // Start session with 10 tasks
    cy.get('[data-cy="input-total-tasks"]').type('10')
    cy.get('[data-cy="btn-start"]').click()

    // Verify tracking view is shown
    cy.get('[data-cy="input-tasks"]').should('be.visible')
    cy.get('[data-cy="btn-plus-one"]').should('be.visible')

    // Normal input - completed mode (default)
    cy.get('[data-cy="input-tasks"]').type('2')
    cy.get('[data-cy="input-tasks"]').type('{enter}')
    cy.contains('2 / 10').should('be.visible')

    // Normal input - completed mode
    cy.get('[data-cy="input-tasks"]').type('4')
    cy.get('[data-cy="input-tasks"]').type('{enter}')
    cy.contains('4 / 10').should('be.visible')

    // +1 button (should increment to 5)
    cy.get('[data-cy="btn-plus-one"]').click()
    cy.contains('5 / 10').should('be.visible')

    // Invalid input in completed mode (try to enter 3, which is less than current 5)
    cy.get('[data-cy="input-tasks"]').type('3')
    cy.get('[data-cy="input-tasks"]').parents('.q-field').should('have.class', 'q-field--error')
    cy.get('[data-cy="input-tasks"]').clear()

    // Switch to remaining mode
    cy.get('[data-cy="btn-toggle-mode"]').click()
    cy.get('[data-cy="input-tasks"]').should('have.attr', 'aria-label').and('include', 'noch')

    // Input in remaining mode (3 remaining = 7 completed)
    cy.get('[data-cy="input-tasks"]').type('3')
    cy.get('[data-cy="input-tasks"]').type('{enter}')
    cy.contains('7 / 10').should('be.visible')

    // Input in remaining mode (2 remaining = 8 completed)
    cy.get('[data-cy="input-tasks"]').type('2')
    cy.get('[data-cy="input-tasks"]').type('{enter}')
    cy.contains('8 / 10').should('be.visible')

    // +1 button in remaining mode (should increment to 9)
    cy.get('[data-cy="btn-plus-one"]').click()
    cy.contains('9 / 10').should('be.visible')

    // Delete row: Click delete button for measurement at index 1 (second measurement)
    cy.get('[data-cy="measurement-table"]').should('be.visible')
    cy.get('[data-cy="btn-delete-1"]').click()
    // Verify the row count decreased
    cy.get('[data-cy="measurement-table"] tbody tr').should('have.length', 5)

    // Invalid input in remaining mode (try to enter 5, which is >= current remaining of 1)
    cy.get('[data-cy="input-tasks"]').type('5')
    cy.get('[data-cy="input-tasks"]').parents('.q-field').should('have.class', 'q-field--error')
    cy.get('[data-cy="input-tasks"]').clear()

    // Input 0 in remaining mode to finalize (0 remaining = 10 completed)
    cy.get('[data-cy="input-tasks"]').type('0')
    cy.get('[data-cy="input-tasks"]').type('{enter}')
    cy.contains('10 / 10').should('be.visible')

    // Verify input controls are hidden when complete
    cy.get('[data-cy="input-tasks"]').should('not.exist')
    cy.get('[data-cy="btn-plus-one"]').should('not.exist')

    // Verify measurement table exists and has entries
    cy.get('[data-cy="measurement-table"]').should('be.visible')
    cy.get('[data-cy="measurement-table"] tbody tr').should('have.length.at.least', 1)

    // Test reset functionality
    cy.get('[data-cy="btn-reset-session"]').click()
    cy.get('[data-cy="input-total-tasks"]').should('be.visible')
  })
})
