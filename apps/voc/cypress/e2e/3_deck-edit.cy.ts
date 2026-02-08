/* cspell:disable */
describe('VOC Deck Edit Functionality', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('navigate to deck edit page and verify UI elements', () => {
    // Navigate to Cards
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')

    // Navigate to Decks edit
    cy.get('[data-cy="edit-decks-button"]').click()
    cy.url().should('include', '/decks-edit')

    // Verify UI elements are present
    cy.get('[data-cy="add-deck-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
  })

  it('add a new deck', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()

    // Add a new deck
    cy.get('[data-cy="add-deck-button"]').click()

    // Verify the new deck appears in the list
    cy.get('[data-cy="deck-item"]').should('have.length.greaterThan', 0)
  })

  it('rename a deck', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()

    // Add a deck first
    cy.get('[data-cy="add-deck-button"]').click()

    // Find the rename button for the newly added deck
    cy.get('[data-cy="deck-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="rename-deck-button"]').click()
      })

    // Type new name in the input
    cy.get('[data-cy="rename-input"]').clear().type('Renamed Deck')
    cy.get('[data-cy="save-rename-button"]').click()

    // Verify the deck was renamed
    cy.get('[data-cy="deck-item"]').last().should('contain', 'Renamed Deck')
  })

  it('delete a deck', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()

    // Add a deck first
    cy.get('[data-cy="add-deck-button"]').click()
    cy.get('[data-cy="deck-item"]').should('have.length.greaterThan', 0)

    // Delete the deck
    cy.get('[data-cy="deck-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="remove-deck-button"]').click()
      })

    // Confirm deletion in the dialog
    cy.get('.q-dialog').should('be.visible')
    cy.contains('button', 'OK').click()
  })

  it('navigate back from deck edit page using back button', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()
    cy.url().should('include', '/decks-edit')

    cy.get('[data-cy="back-button"]').click()
    cy.url().should('include', '/cards')
    cy.url().should('not.include', '/decks-edit')
  })

  it('navigate back from deck edit page using escape key', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()
    cy.url().should('include', '/decks-edit')

    cy.get('body').type('{esc}')
    cy.url().should('include', '/cards')
    cy.url().should('not.include', '/decks-edit')
  })

  it('persist deck changes after page reload', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-decks-button"]').click()

    // Add a deck
    cy.get('[data-cy="add-deck-button"]').click()
    cy.get('[data-cy="deck-item"]').should('have.length.greaterThan', 0)

    // Reload the page
    cy.reload()

    // Verify the deck still exists
    cy.get('[data-cy="deck-item"]').should('have.length.greaterThan', 0)
  })
})
/* cspell:enable */
