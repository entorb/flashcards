<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useGameStore } from '../composables/useGameStore'
import { loadLastSettings, saveLastSettings } from '../services/storage'

const { getDecks, switchDeck } = useGameStore()

const currentDeck = ref<string>('en')
const deckOptions = ref<{ label: string; value: string }[]>([])

onMounted(() => {
  // Load current deck from settings
  const settings = loadLastSettings()
  if (settings?.deck) {
    currentDeck.value = settings.deck
  }

  // Load deck options
  const decks = getDecks()
  deckOptions.value = decks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))
})

function handleDeckChange(deckName: string) {
  currentDeck.value = deckName
  switchDeck(deckName)

  // Update settings
  const settings = loadLastSettings()
  if (settings) {
    settings.deck = deckName
    saveLastSettings(settings)
  }
}

// Expose refresh method for parent components
function refresh() {
  const decks = getDecks()
  deckOptions.value = decks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))

  // Check if current deck still exists
  const deckExists = decks.some(d => d.name === currentDeck.value)
  if (!deckExists && decks.length > 0) {
    handleDeckChange(decks[0].name)
  }
}

defineExpose({ refresh })
</script>

<template>
  <q-select
    v-model="currentDeck"
    outlined
    dense
    :options="deckOptions"
    emit-value
    map-options
    style="min-width: 200px"
    @update:model-value="handleDeckChange"
  />
</template>
