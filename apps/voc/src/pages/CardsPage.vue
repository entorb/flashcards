<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import type { BaseCard } from '@flashcards/shared'
import { CardsManagementPage } from '@flashcards/shared/components'

import { useGameStore } from '../composables/useGameStore'
import { loadSettings, saveSettings } from '../services/storage'

const store = useGameStore()

function getCardLabel(card: BaseCard): string {
  const c = card as unknown as { voc: string; de: string }
  return `${c.voc} → ${c.de}`
}

function getCardKey(card: BaseCard): string {
  const c = card as unknown as { voc: string }
  return c.voc
}
</script>

<template>
  <CardsManagementPage
    app-prefix="voc"
    :title="TEXT_DE.voc.cards.editCardsTitle"
    :banner-html="TEXT_DE.voc.cards.header"
    :decks-title="TEXT_DE.voc.decks.title"
    edit-cards-route="/cards-edit"
    edit-decks-route="/decks-edit"
    :get-decks="() => store.getDecks()"
    :switch-deck="name => store.switchDeck(name)"
    :load-settings="loadSettings"
    :save-settings="saveSettings"
    :store="store"
    :get-card-label="getCardLabel"
    :get-card-key="getCardKey"
  />
</template>
