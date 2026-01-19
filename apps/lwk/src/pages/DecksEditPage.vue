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
  let newIndex = 1
  let deckName: string
  do {
    deckName = `Lernwörter_${newIndex++}`
  } while (decks.value.some(d => d.name === deckName))

  const success = addDeck(deckName)
  if (success) {
    refreshDecks()
  } else {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.decks.duplicateNameError
    })
  }
}

function handleRemoveDeck(deckName: string) {
  if (decks.value.length <= 1) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.decks.lastDeckError
    })
    return
  }

  $q.dialog({
    title: TEXT_DE.lwk.decks.confirmRemoveTitle,
    message: TEXT_DE.lwk.decks.confirmRemoveMessage.replace('{name}', deckName),
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

function saveRename() {
  if (!editingDeckName.value) return

  const trimmedName = newDeckName.value.trim()
  if (!trimmedName) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.decks.emptyNameError
    })
    return
  }

  if (trimmedName !== editingDeckName.value) {
    const success = renameDeck(editingDeckName.value, trimmedName)
    if (!success) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.lwk.decks.duplicateNameError
      })
      return
    }
  }

  editingDeckName.value = null
  newDeckName.value = ''
  refreshDecks()
}

function cancelRename() {
  editingDeckName.value = null
  newDeckName.value = ''
}

function handleRenameKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveRename()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRename()
  }
}
</script>

<template>
  <q-page
    class="q-pa-md deck-management-page"
    style="max-width: 700px; margin: 0 auto"
  >
    <!-- Header with back button -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="handleGoBack"
      />
      <div class="text-h6">{{ TEXT_DE.lwk.decks.editDecksTitle }}</div>
      <div style="width: 40px"></div>
    </div>

    <!-- Add new deck button -->
    <q-btn
      class="q-mb-md full-width"
      color="primary"
      icon="add"
      :label="TEXT_DE.lwk.decks.addDeck"
      data-cy="add-deck-button"
      @click="handleAddDeck"
    />

    <!-- Decks list -->
    <q-list
      bordered
      separator
      class="rounded-borders"
    >
      <q-item
        v-for="deck in decks"
        :key="deck.name"
        class="q-py-md"
        data-cy="deck-item"
      >
        <!-- Edit mode -->
        <q-item-section v-if="editingDeckName === deck.name">
          <!-- eslint-disable vuejs-accessibility/no-autofocus -->
          <q-input
            v-model="newDeckName"
            dense
            outlined
            autofocus
            :placeholder="TEXT_DE.lwk.decks.deckNamePlaceholder"
            data-cy="rename-input"
            @keydown="handleRenameKeydown"
          >
            <template #append>
              <q-btn
                flat
                dense
                round
                icon="check"
                color="positive"
                data-cy="save-rename-button"
                @click="saveRename"
              />
              <q-btn
                flat
                dense
                round
                icon="close"
                color="negative"
                data-cy="cancel-rename-button"
                @click="cancelRename"
              />
            </template>
          </q-input>
          <!-- eslint-enable vuejs-accessibility/no-autofocus -->
        </q-item-section>

        <!-- Display mode -->
        <template v-else>
          <q-item-section>
            <q-item-label>{{ deck.name }}</q-item-label>
            <q-item-label caption>{{ deck.cards.length }} Wörter</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-sm">
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                :aria-label="TEXT_DE.cards.rename"
                data-cy="rename-deck-button"
                @click="startRename(deck.name)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                :aria-label="TEXT_DE.cards.delete"
                :disable="decks.length <= 1"
                data-cy="remove-deck-button"
                @click="handleRemoveDeck(deck.name)"
              />
            </div>
          </q-item-section>
        </template>
      </q-item>
    </q-list>
  </q-page>
</template>

<style scoped>
.deck-management-page {
  padding-bottom: 100px;
}
</style>
