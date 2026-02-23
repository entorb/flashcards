<script
  setup
  lang="ts"
  generic="T extends { name: string; cards: BaseCard[] }, S extends { deck?: string }"
>
import { onMounted, ref } from 'vue'

import type { BaseCard } from '../types'

export interface DeckSelectorProps<
  T extends { name: string; cards: BaseCard[] },
  S extends { deck?: string }
> {
  getDecks: () => T[]
  switchDeck: (deckName: string) => void
  loadSettings?: () => S | null
  saveSettings?: (settings: S) => void
}

const props = defineProps<DeckSelectorProps<T, S>>()

const currentDeck = ref<string>('')
const deckOptions = ref<{ label: string; value: string }[]>([])

onMounted(() => {
  loadDecksAndSettings()
})

function loadDecksAndSettings() {
  // Load current deck from settings if available
  if (props.loadSettings) {
    const settings = props.loadSettings()
    if (settings?.deck) {
      currentDeck.value = settings.deck
    }
  }

  // Load deck options
  const decks = props.getDecks()
  deckOptions.value = decks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))

  // Validate that current deck exists, fall back to first deck if not
  const deckExists = decks.some(d => d.name === currentDeck.value)
  const firstDeck = decks[0]
  if (!deckExists && firstDeck !== undefined) {
    handleDeckChange(firstDeck.name)
  }
}

function handleDeckChange(deckName: string) {
  currentDeck.value = deckName
  props.switchDeck(deckName)

  // Update settings if available
  if (props.loadSettings && props.saveSettings) {
    const settings = props.loadSettings()
    if (settings) {
      const updatedSettings = { ...settings, deck: deckName }
      props.saveSettings(updatedSettings)
    }
  }
}

// Expose refresh method for parent components
function refresh() {
  loadDecksAndSettings()
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
