// Shared test utilities for LWK Cypress tests

export type SpellCard = {
  word: string
  level: number
  time: number
}

export type SpellDeck = {
  name: string
  cards: SpellCard[]
}

export type SpellLastSettings = {
  deck?: string
}

export type LwkGameState = {
  gameCards?: SpellCard[]
}

export const STORAGE_KEYS = {
  decks: 'lwk-decks',
  lastSettings: 'lwk-last-settings',
  gameState: 'lwk-game-state'
} as const

export const loadDecks = (win: Cypress.AUTWindow): SpellDeck[] => {
  const stored = win.localStorage.getItem(STORAGE_KEYS.decks)
  if (!stored) return []
  try {
    return JSON.parse(stored) as SpellDeck[]
  } catch {
    return []
  }
}

export const saveDecks = (win: Cypress.AUTWindow, decks: SpellDeck[]): void => {
  win.localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(decks))
}

export const getCurrentDeckName = (win: Cypress.AUTWindow): string => {
  const stored = win.localStorage.getItem(STORAGE_KEYS.lastSettings)
  if (!stored) return ''
  try {
    const parsed = JSON.parse(stored) as SpellLastSettings
    return parsed.deck ?? ''
  } catch {
    return ''
  }
}

export const normalizeDecks = (win: Cypress.AUTWindow, level: number, time: number): void => {
  const decks = loadDecks(win)
  if (decks.length === 0) return

  const updatedDecks = decks.map(deck => ({
    ...deck,
    cards: deck.cards.map(card => ({
      ...card,
      level,
      time
    }))
  }))

  saveDecks(win, updatedDecks)
}

export const loadGameState = (win: Cypress.AUTWindow): LwkGameState | null => {
  const stored = win.sessionStorage.getItem(STORAGE_KEYS.gameState)
  if (!stored) return null
  try {
    return JSON.parse(stored) as LwkGameState
  } catch {
    return null
  }
}
