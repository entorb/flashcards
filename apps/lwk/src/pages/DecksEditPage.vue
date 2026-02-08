<script setup lang="ts">
import { DecksEditPage } from '@flashcards/shared/pages'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'

const router = useRouter()
const { getDecks, addDeck, removeDeck, renameDeck } = useGameStore()

function getNamingPattern() {
  return { prefix: 'Lernwörter_', startIndex: 1 }
}

function handleBack() {
  router.push('/cards')
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
    @back="handleBack"
  />
</template>
