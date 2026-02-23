/* cspell:disable */
describe('VOC Card Edit Functionality', () => {
  beforeEach(() => {
    // Visit with onBeforeLoad to set up empty deck before app initializes
    cy.visit('/', {
      onBeforeLoad(win: Cypress.AUWindow) {
        win.localStorage.clear()
        win.sessionStorage.clear()
        // Set up empty deck to prevent default cards from loading
        win.localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: [] }]))
      }
    })
  })

  it('navigate to card edit page and verify UI elements', () => {
    // Navigate to Cards
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')

    // Navigate to Cards edit
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Verify UI elements are present
    cy.get('[data-cy="add-card-button"]').should('be.visible')
    cy.get('[data-cy="export-button"]').should('be.visible')
    cy.get('[data-cy="import-button"]').should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')
  })

  it('add a new card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()

    // Wait for edit page to load
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="back-button"]').should('be.visible')

    // Add a new card
    cy.get('[data-cy="add-card-button"]').click()

    // Verify that a new card input field appears
    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).should('exist')

    // Add a new card
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 2)

    // Verify we now have 2 cards total
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Edit the card using specific data-cy selectors
    cy.get('[data-cy="card-voc-0"]').clear().type('Apfel')
    cy.get('[data-cy="card-de-0"]').clear().type('Apple')

    // Verify the card was edited
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Apfel')
    cy.get('[data-cy="card-de-0"]').should('have.value', 'Apple')
  })

  it('delete a card', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()

    // Wait for edit page to load
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    // Add two cards first (last card cannot be deleted)
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 1)
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Delete the first card using the specific data-cy selector
    cy.get('[data-cy="delete-card-0"]').click()

    // Verify one card remains
    cy.get('[data-cy="card-edit-item"]').should('have.length', 1)
  })

  it('export cards to clipboard', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="add-card-button"]').should('be.visible')

    // Add a test card
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]').clear().type('Haus')
    cy.get('[data-cy="card-de-0"]').clear().type('House')

    // Export cards
    cy.get('[data-cy="export-button"]').click()

    // Verify the button text changed to "Kopiert"
    cy.get('[data-cy="export-button"]').invoke('text').should('include', 'Kopiert')
  })

  it('import cards from text with tab delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Mock clipboard API
    const importData = 'voc\tde\tlevel\nApfel\tApple\t1\nBanane\tBanana\t2\nKirsche\tCherry\t3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]', { timeout: 5000 }).click()

    // Wait for success notification
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')

    // Verify cards were imported (3 cards)
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 3)
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Apfel')
    cy.get('[data-cy="card-voc-1"]').should('have.value', 'Banane')
    cy.get('[data-cy="card-voc-2"]').should('have.value', 'Kirsche')
  })

  it('import cards from text with semicolon delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Mock clipboard API with semicolon delimiter
    const importData = 'voc;de;level\nHaus;House;1\nBaum;Tree;2'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]', { timeout: 5000 }).click()

    // Wait for success notification
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')

    // Verify cards were imported (2 cards)
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 2)
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Haus')
    cy.get('[data-cy="card-voc-1"]').should('have.value', 'Baum')
  })

  it('import cards from text with comma delimiter', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Mock clipboard API with comma delimiter
    const importData = 'voc,de,level\nKatze,Cat,1\nHund,Dog,2\nVogel,Bird,3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]', { timeout: 5000 }).click()

    // Wait for success notification
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')

    // Verify cards were imported (3 cards)
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 3)
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Katze')
    cy.get('[data-cy="card-voc-1"]').should('have.value', 'Hund')
    cy.get('[data-cy="card-voc-2"]').should('have.value', 'Vogel')
  })

  it('mass import large number of cards', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Create a large import dataset
    let importData = 'voc\tde\tlevel\n'
    for (let i = 1; i <= 50; i++) {
      importData += `Word${i}\tTranslation${i}\t${(i % 5) + 1}\n`
    }

    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]', { timeout: 5000 }).click()

    // Wait for success notification
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')

    // Verify all 50 cards were imported (50 cards)
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 50)
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Word1')
    cy.get('[data-cy="card-voc-49"]').should('have.value', 'Word50')
  })

  it('import cards replaces existing cards', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')

    // Add initial cards
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).click()
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 1)
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-edit-item"]').should('have.length', 2)

    // Import new cards
    const importData = 'voc\tde\tlevel\nNeu1\tNew1\t1\nNeu2\tNew2\t2\nNeu3\tNew3\t3'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    cy.get('[data-cy="import-button"]').click()

    // Wait for success notification
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')

    // Verify cards were replaced with exactly 3 new cards
    cy.get('[data-cy="card-edit-item"]', { timeout: 5000 }).should('have.length', 3)
    cy.get('[data-cy="card-voc-0"]').should('have.value', 'Neu1')
    cy.get('[data-cy="card-voc-1"]').should('have.value', 'Neu2')
    cy.get('[data-cy="card-voc-2"]').should('have.value', 'Neu3')
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
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
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
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('show error when importing with empty voc field', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with missing voc field
    const importData = 'voc\tde\tlevel\n\tApple\t1'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('show error when importing with empty de field', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API with missing de field
    const importData = 'voc\tde\tlevel\nApfel\t\t1'
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').resolves(importData)
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
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

    // Add a card but leave voc empty
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-de-0"]').clear().type('Apple')

    // Try to go back without filling the voc field
    cy.get('[data-cy="back-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('validate empty de field before saving', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.get('[data-cy="add-card-button"]').should('be.visible')

    // Add a card but leave de empty
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]').clear().type('Apfel')

    // Try to go back without filling the de field
    cy.get('[data-cy="back-button"]').click()

    // Verify error notification appears
    cy.get('.q-notification', { timeout: 5000 }).should('be.visible')
  })

  it('persist card changes after page reload', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should('include', '/cards')
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    // Add and edit a card
    cy.get('[data-cy="add-card-button"]').click()
    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).clear().type('PersistTest')
    cy.get('[data-cy="card-de-0"]').clear().type('PersistTestDE')

    // Go back to save
    cy.get('[data-cy="back-button"]').click()

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('not.include', '/cards-edit')
    cy.url().should('include', '/cards')

    // Navigate back to cards edit
    cy.get('[data-cy="edit-cards-button"]').click()
    cy.url().should('include', '/cards-edit')
    cy.get('[data-cy="add-card-button"]', { timeout: 5000 }).should('be.visible')

    // Verify the card persists
    cy.get('[data-cy="card-voc-0"]', { timeout: 5000 }).should('have.value', 'PersistTest')
    cy.get('[data-cy="card-de-0"]').should('have.value', 'PersistTestDE')
  })

  it('handle manual import dialog when clipboard access fails', () => {
    cy.get('[data-cy="cards-button"]').click()
    cy.get('[data-cy="edit-cards-button"]').click()

    // Mock clipboard API to reject
    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, 'readText').rejects(new Error('Clipboard access denied'))
    })

    // Click import button
    cy.get('[data-cy="import-button"]').click()

    // Verify manual import dialog appears
    cy.get('.q-dialog', { timeout: 5000 }).should('be.visible')
  })
})
/* cspell:enable */
