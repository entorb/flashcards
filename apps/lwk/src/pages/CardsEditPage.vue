<script setup lang="ts">
import {
  MAX_LEVEL,
  MAX_TIME,
  MIN_LEVEL,
  normalizeWhitespace,
  TEXT_DE,
  useCardsEdit
} from '@flashcards/shared'
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

// Always-present blank last row for adding new cards
const { isBlankRow, rows, commitNewCard, onInputKeydown, onInputBlur, removeCard } =
  useCardsEdit<Card>({
    editingCards,
    createEmptyCard: () => ({ word: '', level: MIN_LEVEL, time: MAX_TIME }),
    fieldOrder: ['word'],
    prepareCard: pending => {
      const word = normalizeWhitespace(pending.word)
      if (!word) return null
      return { card: { word, level: MIN_LEVEL, time: MAX_TIME }, key: word }
    },
    duplicateMessage: key => TEXT_DE.lwk.cards.validationDuplicate.replace('{word}', key),
    getKey: card => card.word
  })

onMounted(() => {
  // Initialize with a copy of current cards, sorted alphabetically ignoring case
  editingCards.value = allCards.value
    .map(card => ({ ...card }))
    .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()))
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleGoBack() {
  // Commit a word typed but not yet confirmed in the blank last row
  if (!commitNewCard(false)) return

  // Validate and auto-save before leaving
  if (editingCards.value.some(card => !card.word.trim())) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.validationWordEmpty
    })
    return
  }

  // Auto-save — normalize whitespace from user inputs
  for (const card of editingCards.value) {
    card.word = normalizeWhitespace(card.word)
  }

  // Reject duplicates
  const seen = new Set<string>()
  for (const card of editingCards.value) {
    if (seen.has(card.word)) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.lwk.cards.validationDuplicate.replace('{word}', card.word)
      })
      return
    }
    seen.add(card.word)
  }

  importCards(editingCards.value)
  void router.push({ name: '/CardsManPage' })
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

function onCardChange() {
  // Auto-save could be triggered here if needed
}

function getLevelOptions() {
  const options: { label: string; value: number }[] = []
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
      <h2 class="q-ma-none text-h6">
        {{ TEXT_DE.lwk.cards.editCardsTitle }}
      </h2>
      <div style="width: 40px" />
    </div>

    <div class="q-gutter-lg">
      <!-- Export and Import buttons -->
      <div class="row q-gutter-md items-center">
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
        bordered
        separator
        class="rounded-borders q-mb-md"
      >
        <q-item
          v-for="(card, index) in rows"
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
                @blur="onInputBlur(index)"
                @keydown="onInputKeydown(index, 'word', $event)"
              />

              <!-- Level select and delete, only for committed cards -->
              <template v-if="!isBlankRow(index)">
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
                  @click="removeCard(index)"
                />
              </template>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<style scoped>
.cards-edit-page {
  min-height: 100vh;
  padding-bottom: 100px !important;
}
</style>
