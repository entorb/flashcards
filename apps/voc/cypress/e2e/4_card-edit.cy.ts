/* cspell:disable */
describe('VOC Card Edit Functionality', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win: Cypress.AUTWindow) {
        win.localStorage.clear()
        win.sessionStorage.clear()
        win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: [] }]))
      }
    })
  })

  it('navigate to card edit page and verify UI elements', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    cy.get('[data-cy="add-card-button"]').should('be.visible')
    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
  })

  it('add a new card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).should('exist')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 2)

    cy.get('[data-cy="card-voc-0"]').clear().type('Apfel')
    cy.get('[data-cy="card-de-0"]').clear().type('Apple')
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Apfel')
    cy.get('[data-cy="card-de-0"]').should('have.value', 'Apple')
  })

  it('delete a card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 1)
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="delete-card-0"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('navigate back from card edit page using back button', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    cy.get('[data-cy="back-button"]').click()
    cy.url().should('include', '/cards')
    cy.url().should('not.include', '/cards-edit')
  })

  it('navigate back from card edit page using escape key', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    cy.get('body').type('{esc}')
    cy.url().should('include', '/cards')
    cy.url().should('not.include', '/cards-edit')
  })

  it('validate empty voc field before saving', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="add-card-button"]').should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-de-0"]').clear().type('Apple')
    cy.get('[data-cy="back-button"]').click()

    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('validate empty de field before saving', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="add-card-button"]').should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]').clear().type('Apfel')
    cy.get('[data-cy="back-button"]').click()

    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('persist card changes after page reload', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).clear().type('PersistTest')
    cy.get('[data-cy="card-de-0"]').clear().type('PersistTestDE')

    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')
    cy.url().should('include', '/cards')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).should('have.value', 'PersistTest')
    cy.get('[data-cy="card-de-0"]').should('have.value', 'PersistTestDE')
  })
})
/* cspell:enable */
