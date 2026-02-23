<script setup lang="ts">
import type { BaseCard } from '@flashcards/shared'
import { TEXT_DE } from '@flashcards/shared'
import { CardsManPage } from '@flashcards/shared/components'

import { useGameStore } from '@/composables/useGameStore'
import { loadSettings, saveSettings } from '@/services/storage'

const store = useGameStore()

function getCardLabel(card: BaseCard): string {
  const c = card as unknown as { word: string }
  return c.word
}

function getCardKey(card: BaseCard): string {
  const c = card as unknown as { word: string }
  return c.word
}

function switchDeck(name: string): void {
  store.switchDeck(name)
}
</script>

<template>
  <CardsManPage
    app-prefix="lwk"
    :title="TEXT_DE.voc.cards.editCardsTitle"
    :banner-html="TEXT_DE.lwk.cards.header"
    :decks-title="TEXT_DE.voc.decks.title"
    edit-cards-route="/cards-edit"
    edit-decks-route="/decks"
    :get-decks="() => store.getDecks()"
    :switch-deck="switchDeck"
    :load-settings="loadSettings"
    :save-settings="saveSettings"
    :store="store"
    :get-card-label="getCardLabel"
    :get-card-key="getCardKey"
  />
</template>
