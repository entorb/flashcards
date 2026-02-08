<script setup lang="ts">
import { TEXT_DE, MAX_LEVEL, MAX_TIME, MIN_LEVEL } from '@flashcards/shared'
import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'
import type { Card } from '../types'
import { parseCardsFromText } from '../utils/helpers'

const router = useRouter()
const $q = useQuasar()
const { allCards, importCards } = useGameStore()

// Create a working copy of cards for editing
const editingCards = ref<Card[]>([])
const exportButtonText = ref<string>(TEXT_DE.voc.cards.export)

onMounted(() => {
  // Initialize with a copy of current cards
  editingCards.value = allCards.value.map(card => ({ ...card }))
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleGoBack() {
  // Validate and auto-save before leaving
  const invalidCard = editingCards.value.find(card => !card.word.trim())
  if (invalidCard) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.validationWordEmpty
    })
    return
  }

  // Auto-save
  importCards(editingCards.value)
  router.push('/cards')
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoBack()
  }
}

function handleExport() {
  const header = 'word\tlevel\n'
  const tsvContent = editingCards.value.map(c => `${c.word}\t${c.level}`).join('\n')
  navigator.clipboard
    .writeText(header + tsvContent)
    .then(() => {
      exportButtonText.value = TEXT_DE.shared.cardActions.copied
      setTimeout(() => (exportButtonText.value = TEXT_DE.voc.cards.export), 2000)
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.shared.cardActions.clipboardError
      })
    })
}

async function handleImport() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    processImportText(clipboardText)
  } catch {
    // Clipboard access failed - offer manual paste as fallback
    showManualImportDialog()
  }
}

function showManualImportDialog() {
  $q.dialog({
    title: TEXT_DE.lwk.cards.importDialogTitle,
    message: TEXT_DE.lwk.cards.importDialogMessage,
    prompt: {
      model: '',
      type: 'textarea',
      outlined: true
    },
    cancel: true,
    class: 'bordered'
  }).onOk((text: string) => {
    processImportText(text)
  })
}

function processImportText(text: string) {
  if (!text) {
    $q.notify({ type: 'negative', message: TEXT_DE.shared.cardActions.emptyTextError })
    return
  }

  const parseResult = parseCardsFromText(text)

  if (!parseResult) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.noDelimiterError
    })
    return
  }

  const { cards: newCards, delimiter } = parseResult

  if (newCards.length === 0) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.noCardsFoundError.replace('{delimiter}', delimiter)
    })
    return
  }

  editingCards.value = newCards
  $q.notify({
    type: 'positive',
    message: TEXT_DE.lwk.cards.importSuccess.replace('{count}', newCards.length.toString())
  })
}

function handleAddCard() {
  editingCards.value.push({
    word: '',
    level: MIN_LEVEL,
    time: MAX_TIME
  })
}

function handleRemoveCard(index: number) {
  editingCards.value.splice(index, 1)
}

function onCardChange() {
  // Auto-save could be triggered here if needed
}

function getLevelOptions() {
  const options = []
  for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
    options.push({ label: i.toString(), value: i })
  }
  return options
}
</script>

<template>
  <q-page
    class="q-pa-md cards-edit-page"
    style="max-width: 900px; margin: 0 auto"
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
        <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
      </q-btn>
      <h2 class="q-ma-none text-h6">{{ TEXT_DE.lwk.cards.editCardsTitle }}</h2>
      <div style="width: 40px" />
    </div>

    <div class="q-gutter-lg">
      <!-- Export and Import buttons -->
      <div class="row q-gutter-md items-center">
        <q-btn
          outline
          color="primary"
          icon="add"
          :label="TEXT_DE.lwk.cards.addNewCard"
          no-caps
          data-cy="add-card-button"
          @click="handleAddCard"
        />
        <q-btn
          outline
          color="primary"
          icon="arrow_upward"
          :label="exportButtonText"
          no-caps
          data-cy="export-button"
          @click="handleExport"
        />
        <q-btn
          outline
          color="primary"
          icon="arrow_downward"
          :label="TEXT_DE.voc.cards.import"
          no-caps
          data-cy="import-button"
          @click="handleImport"
        />
      </div>

      <div>{{ TEXT_DE.lwk.cards.importHintExcel }}</div>

      <!-- Cards list -->
      <q-list
        v-if="editingCards.length > 0"
        bordered
        separator
        class="rounded-borders q-mb-md"
      >
        <q-item
          v-for="(card, index) in editingCards"
          :key="index"
          class="q-py-md"
          data-cy="card-edit-item"
        >
          <q-item-section>
            <div class="row q-gutter-sm items-center">
              <!-- Word input -->
              <q-input
                v-model="card.word"
                dense
                outlined
                :placeholder="TEXT_DE.lwk.cards.wordPlaceholder"
                class="col"
                data-cy="word-input"
                @update:model-value="onCardChange"
              />

              <!-- Level select -->
              <q-select
                v-model="card.level"
                dense
                outlined
                :options="getLevelOptions()"
                emit-value
                map-options
                label="Level"
                style="width: 100px"
                data-cy="level-select"
                @update:model-value="onCardChange"
              />

              <!-- Delete button -->
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                data-cy="delete-card-button"
                @click="handleRemoveCard(index)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Empty state -->
      <div
        v-else
        class="text-center q-pa-xl text-grey-6"
      >
        {{ TEXT_DE.lwk.cards.noCardsYet }}
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.cards-edit-page {
  min-height: 100vh;
  padding-bottom: 100px !important;
}
</style>
