// Shared test utilities for LWK Cypress tests

import { STORAGE_KEYS } from '../../src/types'

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

export const loadDecks = (win: Cypress.AUTWindow): SpellDeck[] => {
  const stored = win.localStorage.getItem(STORAGE_KEYS.DECKS)
  if (!stored) return []
  try {
    return JSON.parse(stored) as SpellDeck[]
  } catch {
    return []
  }
}

export const saveDecks = (win: Cypress.AUTWindow, decks: SpellDeck[]): void => {
  win.localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks))
}

export const getCurrentDeckName = (win: Cypress.AUTWindow): string => {
  const stored = win.localStorage.getItem(STORAGE_KEYS.LAST_SETTINGS)
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
  const stored = win.sessionStorage.getItem(STORAGE_KEYS.GAME_STATE)
  if (!stored) return null
  try {
    return JSON.parse(stored) as LwkGameState
  } catch {
    return null
  }
}
