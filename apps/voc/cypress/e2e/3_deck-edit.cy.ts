function createDeck(name: string) {
  cy.get('[data-cy="add-deck-button"]').click()
  cy.get('[data-cy="deck-name-input"]').type(name)
  cy.contains("button", "OK").click()
}

describe("VOC Deck Management", () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit("/")
    cy.get('[data-cy="cards-button"]').click()
    cy.url().should("include", "/cards")
  })

  it("create a deck: asks for name, selects empty deck", () => {
    createDeck("Testkiste")
    cy.get('[data-cy="deck-selector"]').should("contain", "Testkiste (0)")
    cy.get('[data-cy="empty-deck-hint"]').should("be.visible")

    // Empty-deck hint leads to card editing
    cy.get('[data-cy="empty-deck-add-cards"]').click()
    cy.url().should("include", "/cards-edit")
  })

  it("cancel create keeps decks unchanged", () => {
    cy.get('[data-cy="add-deck-button"]').click()
    cy.get('[data-cy="deck-name-input"]').type("{esc}")
    // Escape only closes the dialog, stays on cards page
    cy.url().should("match", /\/cards$/)
    cy.get('[data-cy="empty-deck-hint"]').should("not.exist")
  })

  it("rename the current deck", () => {
    createDeck("Testkiste")
    cy.get('[data-cy="rename-deck-button"]').click()
    cy.get('[data-cy="deck-name-input"]').should("have.value", "Testkiste")
    cy.get('[data-cy="deck-name-input"]').clear().type("Umbenannt")
    cy.contains("button", "OK").click()
    cy.get('[data-cy="deck-selector"]').should("contain", "Umbenannt")
  })

  it("delete the current deck", () => {
    createDeck("Testkiste")
    cy.get('[data-cy="remove-deck-button"]').click()
    cy.contains("button", "OK").click()
    cy.get('[data-cy="deck-selector"]').should("not.contain", "Testkiste")
    cy.get('[data-cy="empty-deck-hint"]').should("not.exist")
  })

  it("created deck persists after reload and shows hint on home page", () => {
    createDeck("Testkiste")
    cy.reload()
    cy.get('[data-cy="deck-selector"]').should("contain", "Testkiste")

    cy.get('[data-cy="back-button"]').click()
    cy.url().should("not.include", "/cards")
    cy.get('[data-cy="empty-deck-hint"]').should("be.visible")
  })
})
