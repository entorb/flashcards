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
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
  })

  const typeCard = (voc: string, de: string) => {
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').type(voc)
        cy.get('[data-cy="card-de-input"]').type(de)
      })
  }

  const commitBlankRow = () => {
    cy.get('[data-cy="card-de-input"]').last().type('{enter}')
  }

  it('navigate to card edit page and verify UI elements', () => {
    cy.url().should('include', '/cards')

    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('add a new card by typing and pressing enter', () => {
    typeCard('Apfel', 'Apple')
    commitBlankRow()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    typeCard('Birne', 'Pear')
    commitBlankRow()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)
  })

  it('add a new card by pressing tab', () => {
    typeCard('Tabwort', 'TabwortDE')
    cy.get('[data-cy="card-de-input"]').last().trigger('keydown', { key: 'Tab' })
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'Tabwort')
        cy.get('[data-cy="card-de-input"]').should('have.value', 'TabwortDE')
      })
  })

  it('edit card fields', () => {
    typeCard('Testwort', 'TestwortDE')
    commitBlankRow()

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').clear().type('Geändert')
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'Geändert')
      })
  })

  it('strip and collapse whitespace on commit', () => {
    typeCard('  Mehr   Worte  ', '  Mehr   Deutsch  ')
    commitBlankRow()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'Mehr Worte')
        cy.get('[data-cy="card-de-input"]').should('have.value', 'Mehr Deutsch')
      })
  })

  it('reject duplicate vocables', () => {
    typeCard('Testwort', 'TestwortDE')
    commitBlankRow()
    typeCard('Testwort', 'AnderesDE')
    commitBlankRow()

    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)
    cy.get('.q-notification').should('be.visible')
  })

  it('commit a new card when leaving the blank row', () => {
    typeCard('Blurwort', 'BlurwortDE')
    cy.get('h2').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'Blurwort')
        cy.get('[data-cy="card-de-input"]').should('have.value', 'BlurwortDE')
      })
  })

  it('show a warning when committing a card with empty de field', () => {
    cy.get('[data-cy="card-voc-input"]').last().type('Apfel')
    commitBlankRow()

    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('show a warning when committing a card with empty voc field', () => {
    cy.get('[data-cy="card-de-input"]').last().type('Apple')
    commitBlankRow()

    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('delete a card', () => {
    typeCard('Erstes', 'ErstesDE')
    commitBlankRow()
    typeCard('Zweites', 'ZweitesDE')
    commitBlankRow()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="delete-card-button"]').click()
      })

    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)
  })

  it('navigate back from card edit page using back button', () => {
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('include', '/cards')
  })

  it('navigate back from card edit page using escape key', () => {
    cy.get('body').type('{esc}')
    cy.url().should('include', '/cards')
  })

  it('commit pending card on back', () => {
    typeCard('Unbestätigt', 'UnbestätigtDE')
    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .should('have.length', 2)
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'Unbestätigt')
        cy.get('[data-cy="card-de-input"]').should('have.value', 'UnbestätigtDE')
      })
  })

  it('persist card changes after page reload', () => {
    typeCard('PersistTest', 'PersistTestDE')
    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .should('have.length', 2)
      .first()
      .within(() => {
        cy.get('[data-cy="card-voc-input"]').should('have.value', 'PersistTest')
        cy.get('[data-cy="card-de-input"]').should('have.value', 'PersistTestDE')
      })
  })
})
/* cspell:enable */
