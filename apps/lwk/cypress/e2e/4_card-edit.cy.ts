/* cspell:disable */
describe('LWK Card Edit Functionality', () => {
  beforeEach(() => {
    // Visit with onBeforeLoad to set up empty deck before app initializes
    cy.visit('/', {
      onBeforeLoad(win: Cypress.AUTWindow) {
        win.localStorage.clear()
        win.sessionStorage.clear()
        // Set up empty deck to prevent default cards from loading
        win.localStorage.setItem('fc-lwk-decks', JSON.stringify([{ name: 'LWK_1', cards: [] }]))
        // Set the current deck in settings
        win.localStorage.setItem('fc-lwk-game-settings', JSON.stringify({ deck: 'LWK_1' }))
      }
    })
  })

  it('navigate to card edit page and verify UI elements', () => {
    // Navigate to Cards
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')

    // Navigate to Cards edit
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards')

    // Verify UI elements are present
    cy.get('[data-cy="add-card-button"]').should('be.visible')
    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
  })

  it('add a new card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Add a new card
    cy.get('[data-cy="add-card-button"]').click()

    // Verify the card item appears
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)

    // Add another card
    cy.get('[data-cy="add-card-button"]').click()

    // Verify we now have 2 cards
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)
  })

  it('edit card word', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Add a new card
    cy.get('[data-cy="add-card-button"]').click()

    // Edit the card word
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').type('Testword')
      })

    // Verify the card was edited
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Testword')
      })
  })

  it('delete a card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Add two cards first
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Delete the last card
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="delete-card-button"]').click()
      })

    // Verify the card was deleted
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('import cards from text with tab delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API
    const importData = 'word\tlevel\nApfel\t1\nBanane\t2\nKirsche\t3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify cards were imported
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)

    // Verify the imported data
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Apfel')
      })
  })

  it('import cards from text with semicolon delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with semicolon delimiter
    const importData = 'Haus\nBaum'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify cards were imported
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Verify the imported data
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Haus')
      })
  })

  it('import cards from text with comma delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with comma delimiter and level
    const importData = 'word,level\nKatze,1\nHund,2\nVogel,3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify cards were imported
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)
  })

  it('mass import large number of cards', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Create a large import dataset
    let importData = 'word\tlevel\n'
    for (let i = 1; i <= 50; i++) {
      importData += `Word${i}\t${(i % 5) + 1}\n`
    }

    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify all 50 cards were imported
    cy.get('[data-cy="card-edit-item"]').should('have.length', 50)

    // Verify first and last cards
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Word1')
      })

    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Word50')
      })
  })

  it('import cards replaces existing cards', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Add initial cards
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Import new cards
    const importData = 'word\tlevel\nNeu1\t1\nNeu2\t2\nNeu3\t3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    cy.get('[data-cy="import-button"]').click()

    // Verify cards were replaced with exactly 3 new cards
    cy.get('[data-cy="card-edit-item"]').should('have.length', 3)
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'Neu1')
      })
  })

  it('show error when importing empty text', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with empty text
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves('')
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification').should('be.visible')
  })

  it('show error when importing text with no valid delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with invalid format
    const importData = 'This is just plain text without any delimiters'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification').should('be.visible')
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

    // Add a card but leave word empty
    cy.get('[data-cy="add-card-button"]').click()

    // Try to go back without filling the word
    cy.get('[data-cy="back-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification').should('be.visible')
  })

  it('persist card changes after page reload', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Add and edit a card
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]')
      .last()
      .within(() => {
        cy.get('[data-cy="word-input"]').type('PersistTest')
      })

    // Verify card is visible before going back
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'PersistTest')
      })

    // Go back to save the cards to localStorage
    cy.get('[data-cy="back-button"]').click()
    cy.url().should('include', '/cards')

    // Reload the page to test persistence
    cy.reload()

    // Navigate back to cards edit
    cy.get('[data-cy="edit-cards-button"]').click()

    // Verify the card persists with correct data after reload
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
    cy.get('[data-cy="card-edit-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="word-input"]').should('have.value', 'PersistTest')
      })
  })
})
/* cspell:enable */
