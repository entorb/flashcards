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
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
  })

  const typeWord = (word: string) => {
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').type(word)
      })
  }

  it('navigate to card edit page and verify UI elements', () => {
    cy.url().should('include', '/cards')

    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('add a new card by typing and pressing enter', () => {
    typeWord('Testwort{enter}')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    typeWord('Zweites{enter}')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)
  })

  it('add a new card by pressing tab', () => {
    cy.get('[data-cy="word-input"]').last().type('Tabwort').trigger('keydown', { key: 'Tab' })
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Tabwort')
      })
  })

  it('edit card word', () => {
    typeWord('Testwort{enter}')

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').clear().type('Geändert')
        cy.get('[data-cy="word-input"]').should('have.value', 'Geändert')
      })
  })

  it('strip and collapse whitespace on commit', () => {
    typeWord('  Mehr   Worte  {enter}')
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Mehr Worte')
      })
  })

  it('reject duplicate words', () => {
    typeWord('Testwort{enter}')
    typeWord('Testwort{enter}')

    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)
    cy.get('.q-notification').should('be.visible')
  })

  it('commit a new word when leaving the blank row', () => {
    typeWord('Blurwort')
    cy.get('body').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Blurwort')
      })
  })

  it('delete a card', () => {
    typeWord('Erstes{enter}')
    typeWord('Zweites{enter}')
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

  it('validate empty word before saving', () => {
    typeWord('Testwort{enter}')
    cy.get('[data-cy="word-input"]').first().clear()
    cy.get('[data-cy="back-button"]').click()

    cy.get('.q-notification').should('be.visible')
  })

  it('commit pending word on back', () => {
    typeWord('Unbestätigt')
    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .should('have.length', 2)
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Unbestätigt')
      })
  })

  it('persist card changes after page reload', () => {
    typeWord('PersistTest{enter}')
    cy.get('[data-cy="back-button"]').click()
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')

    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 })
      .should('have.length', 2)
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'PersistTest')
      })
  })
})
/* cspell:enable */
