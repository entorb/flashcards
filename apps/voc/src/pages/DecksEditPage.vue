<script setup lang="ts">
import { DecksEditPage } from '@flashcards/shared/pages'

import { useGameStore } from '../composables/useGameStore'

const { getDecks, addDeck, removeDeck, renameDeck } = useGameStore()

function getNamingPattern() {
  return { prefix: 'deck_', startIndex: 0 }
}
</script>

<template>
  <DecksEditPage
    app-prefix="voc"
    :get-decks="getDecks"
    :add-deck="addDeck"
    :remove-deck="removeDeck"
    :rename-deck="renameDeck"
    :get-naming-pattern="getNamingPattern"
  />
</template>
