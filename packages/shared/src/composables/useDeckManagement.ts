import type { BaseCard } from '../types'

export interface CardDeck<TCard extends BaseCard = BaseCard> {
  name: string
  cards: TCard[]
}

export interface DeckSettings {
  deck?: string
}

export interface DeckManagementOptions<
  TCard extends BaseCard,
  TSettings extends DeckSettings = DeckSettings
> {
  loadDecks: () => Array<CardDeck<TCard>>
  saveDecks: (decks: Array<CardDeck<TCard>>) => void
  loadSettings: () => TSettings | null
  saveSettings: (settings: TSettings) => void
}

export function useDeckManagement<
  TCard extends BaseCard = BaseCard,
  TSettings extends DeckSettings = DeckSettings
>(options: DeckManagementOptions<TCard, TSettings>) {
  const { loadDecks, saveDecks, loadSettings, saveSettings } = options

  function getDecks(): Array<CardDeck<TCard>> {
    return loadDecks()
  }

  function addDeck(name: string): boolean {
    const decks = loadDecks()
    // Check for duplicate name
    if (decks.some(d => d.name === name)) {
      return false
    }
    decks.push({ name, cards: [] })
    saveDecks(decks)
    return true
  }

  function renameDeck(oldName: string, newName: string): boolean {
    const decks = loadDecks()
    // Check for duplicate name
    if (decks.some(d => d.name === newName)) {
      return false
    }
    const deck = decks.find(d => d.name === oldName)
    if (!deck) {
      return false
    }
    deck.name = newName
    saveDecks(decks)
    // Update settings if current deck was renamed
    const settings = loadSettings()
    if (settings?.deck === oldName) {
      settings.deck = newName
      saveSettings(settings)
    }
    return true
  }

  function removeDeck(name: string): boolean {
    const decks = loadDecks()
    // Cannot remove last deck
    if (decks.length <= 1) {
      return false
    }
    const filtered = decks.filter(d => d.name !== name)
    if (filtered.length === decks.length) {
      return false // Deck not found
    }
    saveDecks(filtered)
    // If current deck was removed, update settings and switch to a new default
    const settings = loadSettings()
    const firstRemaining = filtered[0]
    if (settings?.deck === name && firstRemaining !== undefined) {
      settings.deck = firstRemaining.name
      saveSettings(settings)
    }
    return true
  }

  return {
    getDecks,
    addDeck,
    renameDeck,
    removeDeck
  }
}
