<script setup lang="ts">
import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref } from 'vue'

import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'

interface Props {
  appPrefix: 'voc' | 'lwk'
  getDecks: () => Array<{ name: string; cards: Array<BaseCard> }>
  addDeck: (name: string) => boolean
  removeDeck: (name: string) => boolean
  renameDeck: (oldName: string, newName: string) => boolean
  getNamingPattern: () => { prefix: string; startIndex: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{ back: [] }>()

const $q = useQuasar()

const decks = ref<Array<{ name: string; cards: Array<BaseCard> }>>([])
const editingDeckName = ref<string | null>(null)
const newDeckName = ref('')

function refreshDecks() {
  decks.value = props.getDecks()
}

function handleGoBack() {
  emit('back')
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
  const { prefix, startIndex } = props.getNamingPattern()
  let newIndex = startIndex
  let deckName: string
  do {
    deckName = `${prefix}${newIndex++}`
  } while (decks.value.some(d => d.name === deckName))

  const success = props.addDeck(deckName)
  if (success) {
    refreshDecks()
  } else {
    $q.notify({
      type: 'negative',
      message: TEXT_DE[props.appPrefix].decks.duplicateNameError
    })
  }
}

function handleRemoveDeck(deckName: string) {
  if (decks.value.length <= 1) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE[props.appPrefix].decks.lastDeckError
    })
    return
  }

  $q.dialog({
    title: TEXT_DE[props.appPrefix].decks.confirmRemoveTitle,
    message: TEXT_DE[props.appPrefix].decks.confirmRemoveMessage.replace('{name}', deckName),
    cancel: true
  }).onOk(() => {
    const success = props.removeDeck(deckName)
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
      message: TEXT_DE[props.appPrefix].decks.emptyNameError
    })
    return
  }

  if (trimmedName !== editingDeckName.value) {
    const success = props.renameDeck(editingDeckName.value, trimmedName)
    if (!success) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE[props.appPrefix].decks.duplicateNameError
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
      >
        <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
      </q-btn>
      <div class="text-h6">{{ TEXT_DE[appPrefix].decks.editDecksTitle }}</div>
      <div style="width: 40px"></div>
    </div>

    <!-- Add new deck button -->
    <q-btn
      class="q-mb-md full-width"
      color="primary"
      icon="add"
      :label="TEXT_DE[appPrefix].decks.addDeck"
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
            :placeholder="TEXT_DE[appPrefix].decks.deckNamePlaceholder"
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
            <q-item-label caption
              >{{ deck.cards.length }} {{ appPrefix === 'lwk' ? 'Wörter' : 'Karten' }}</q-item-label
            >
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-sm">
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                :aria-label="TEXT_DE.shared.cards.rename"
                data-cy="rename-deck-button"
                @click="startRename(deck.name)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                :aria-label="TEXT_DE.shared.cards.delete"
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
