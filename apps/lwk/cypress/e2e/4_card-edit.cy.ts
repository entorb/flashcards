/* cspell:disable */
describe('LWK Card Edit Functionality', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win: Cypress.AUTWindow) {
        win.localStorage.clear()
        win.sessionStorage.clear()
        win.localStorage.setItem(
          'fc-lwk-decks',
          JSON.stringify([{ name: 'Lernwörter_1', cards: [] }])
        )
      }
    })
  })

  it('navigate to card edit page and verify UI elements', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards')

    cy.get('[data-cy="add-card-button"]').should('be.visible')
    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
  })

  it('add a new card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)
  })

  it('edit card word', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').type('Testword')
      })

    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Testword')
      })
  })

  it('delete a card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="delete-card-button"]').click()
      })

    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('navigate back from card edit page using back button', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('[data-cy="back-button"]').click()
    cy.url().should('include', '/cards')
  })

  it('navigate back from card edit page using escape key', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('body').type('{esc}')
    cy.url().should('include', '/cards')
  })

  it('validate empty word before saving', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="back-button"]').click()

    cy.get('.q-notification').should('be.visible')
  })

  it('persist card changes after page reload', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').type('PersistTest')
      })

    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')
    cy.url().should('include', '/cards')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .should('have.length', 1)
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'PersistTest')
      })
  })
})
/* cspell:enable */
