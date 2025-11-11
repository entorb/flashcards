<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'

const router = useRouter()
const $q = useQuasar()
const { getDecks, addDeck, removeDeck, renameDeck } = useGameStore()

const decks = ref(getDecks())
const editingDeckName = ref<string | null>(null)
const newDeckName = ref('')

function refreshDecks() {
  decks.value = getDecks()
}

function handleGoBack() {
  router.push('/cards')
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (editingDeckName.value) {
      cancelRename()
    } else {
      handleGoBack()
    }
  }
}

onMounted(() => {
  globalThis.addEventListener('keydown', handleKeyDown)
  refreshDecks()
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleAddDeck() {
  const deckCount = decks.value.length
  const defaultName = `deck_${deckCount}`
  newDeckName.value = defaultName

  const success = addDeck(defaultName)
  if (success) {
    refreshDecks()
  } else {
    $q.notify({ type: 'negative', message: TEXT_DE.voc.decks.duplicateNameError })
  }
}

function handleRemoveDeck(deckName: string) {
  if (decks.value.length <= 1) {
    $q.notify({ type: 'negative', message: TEXT_DE.voc.decks.lastDeckError })
    return
  }

  $q.dialog({
    title: TEXT_DE.voc.decks.confirmRemoveTitle,
    message: TEXT_DE.voc.decks.confirmRemoveMessage.replace('{name}', deckName),
    cancel: true
  }).onOk(() => {
    const success = removeDeck(deckName)
    if (success) {
      refreshDecks()
    }
  })
}

function startRename(deckName: string) {
  editingDeckName.value = deckName
  newDeckName.value = deckName
}

function cancelRename() {
  editingDeckName.value = null
  newDeckName.value = ''
}

function saveRename() {
  if (!editingDeckName.value) return

  const trimmedName = newDeckName.value.trim()
  if (!trimmedName) {
    $q.notify({ type: 'negative', message: TEXT_DE.voc.decks.emptyNameError })
    return
  }

  if (trimmedName === editingDeckName.value) {
    cancelRename()
    return
  }

  // renameDeck automatically updates voc-last-settings if the currently selected deck is renamed
  const success = renameDeck(editingDeckName.value, trimmedName)
  if (success) {
    refreshDecks()
    cancelRename()
  } else {
    $q.notify({ type: 'negative', message: TEXT_DE.voc.decks.duplicateNameError })
  }
}
</script>

<template>
  <q-page
    class="q-pa-md"
    style="max-width: 700px; margin: 0 auto"
  >
    <!-- Header with back button -->
    <div class="row items-center justify-between q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="handleGoBack"
      >
        <q-tooltip>{{ TEXT_DE.nav.backToHome }}</q-tooltip>
      </q-btn>
      <h1 class="text-h5 q-ma-none">
        {{ TEXT_DE.voc.decks.title }}
      </h1>
      <div style="width: 40px"></div>
    </div>

    <!-- Deck List -->
    <q-card class="q-mb-md">
      <q-list
        bordered
        separator
      >
        <q-item
          v-for="deck in decks"
          :key="deck.name"
        >
          <q-item-section>
            <q-item-label v-if="editingDeckName !== deck.name">
              {{ deck.name }}
            </q-item-label>
            <!-- eslint-disable vuejs-accessibility/no-autofocus -->
            <q-input
              v-else
              v-model="newDeckName"
              outlined
              dense
              autofocus
              :placeholder="TEXT_DE.voc.decks.deckNamePlaceholder"
              @keyup.enter="saveRename"
              @keyup.esc="cancelRename"
            />
            <!-- eslint-enable vuejs-accessibility/no-autofocus -->
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn
                v-if="editingDeckName !== deck.name"
                flat
                dense
                round
                icon="edit"
                size="sm"
                @click="startRename(deck.name)"
              >
                <q-tooltip>{{ TEXT_DE.voc.decks.renameDeck }}</q-tooltip>
              </q-btn>
              <q-btn
                v-else
                flat
                dense
                round
                icon="check"
                color="positive"
                size="sm"
                @click="saveRename"
              >
                <q-tooltip>{{ TEXT_DE.voc.cards.save }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="editingDeckName !== deck.name"
                flat
                dense
                round
                icon="delete"
                color="negative"
                size="sm"
                :disable="decks.length <= 1"
                @click="handleRemoveDeck(deck.name)"
              >
                <q-tooltip>{{ TEXT_DE.voc.decks.removeDeck }}</q-tooltip>
              </q-btn>
              <q-btn
                v-else
                flat
                dense
                round
                icon="close"
                size="sm"
                @click="cancelRename"
              >
                <q-tooltip>{{ TEXT_DE.common.cancel }}</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Add Deck Button -->
    <q-btn
      outline
      color="primary"
      icon="add"
      :label="TEXT_DE.voc.decks.addDeck"
      no-caps
      class="full-width"
      data-cy="add-deck-button"
      @click="handleAddDeck"
    />
  </q-page>
</template>
