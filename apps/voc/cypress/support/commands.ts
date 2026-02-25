// ***********************************************
// Custom commands for Cypress tests
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

interface VocCard {
  voc: string
  de: string
  level: number
  time: number
}

interface VocDeck {
  name: string
  cards: VocCard[]
}

/**
 * Helper function to get cards from localStorage
 * Extracts cards from the deck structure (fc-voc-cards)
 * @param win - Window object
 * @returns Array of cards from the first deck
 */
export function getCardsFromStorage(win: Window): VocCard[] {
  const stored = win.localStorage.getItem('fc-voc-cards')
  const decks: VocDeck[] = stored ? JSON.parse(stored) : []
  return Array.isArray(decks) && decks.length > 0 && decks[0].cards ? decks[0].cards : []
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get cards from localStorage
       * @example cy.getCardsFromStorage()
       */
      getCardsFromStorage(): Chainable<VocCard[]>
    }
  }
}

Cypress.Commands.add('getCardsFromStorage', () => {
  return cy.window().then(win => {
    return getCardsFromStorage(win)
  })
})

export {}
