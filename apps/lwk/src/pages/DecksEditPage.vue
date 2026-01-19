<script setup lang="ts">
import { DecksEditPage } from '@flashcards/shared/pages'

import { useGameStore } from '../composables/useGameStore'

const { getDecks, addDeck, removeDeck, renameDeck } = useGameStore()

function getNamingPattern() {
  return { prefix: 'Lernwörter_', startIndex: 1 }
}
</script>

<template>
  <DecksEditPage
    app-prefix="lwk"
    :get-decks="getDecks"
    :add-deck="addDeck"
    :remove-deck="removeDeck"
    :rename-deck="renameDeck"
    :get-naming-pattern="getNamingPattern"
  />
</template>
