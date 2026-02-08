// ***********************************************
// Custom commands for Cypress tests
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Helper function to get cards from localStorage
 * Extracts cards from the deck structure (fc-voc-cards)
 * @param win - Window object
 * @returns Array of cards from the first deck
 */
export function getCardsFromStorage(win: Window): any[] {
  const stored = win.localStorage.getItem('fc-voc-cards')
  const decks = stored ? JSON.parse(stored) : []
  // Extract cards from the first deck (or current deck)
  const cards = Array.isArray(decks) && decks.length > 0 && decks[0].cards ? decks[0].cards : []
  return cards
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get cards from localStorage
       * @example cy.getCardsFromStorage()
       */
      getCardsFromStorage(): Chainable<any[]>
    }
  }
}

Cypress.Commands.add('getCardsFromStorage', () => {
  return cy.window().then(win => {
    return getCardsFromStorage(win)
  })
})

export {}
