<script setup lang="ts">
import type { BaseCard } from "@flashcards/shared"
import { TEXT_DE } from "@flashcards/shared"
import { CardsManPage } from "@flashcards/shared/components"

import { useGameStore } from "@/composables/useGameStore"
import { loadSettings } from "@/services/storage"

const store = useGameStore()

function getCardLabel(card: BaseCard): string {
  const c = card as unknown as { word: string }
  return c.word
}

function getCardKey(card: BaseCard): string {
  const c = card as unknown as { word: string }
  return c.word
}
</script>

<template>
  <CardsManPage
    app-prefix="lwk"
    :title="TEXT_DE.voc.cards.editCardsTitle"
    :banner-html="TEXT_DE.lwk.cards.header"
    :decks-title="TEXT_DE.voc.decks.title"
    edit-cards-route="/cards-edit"
    :get-decks="() => store.getDecks()"
    :add-deck="store.addDeck"
    :rename-deck="store.renameDeck"
    :remove-deck="store.removeDeck"
    :select-deck="store.selectDeck"
    :load-settings="loadSettings"
    :store="store"
    :get-card-label="getCardLabel"
    :get-card-key="getCardKey"
  />
</template>
