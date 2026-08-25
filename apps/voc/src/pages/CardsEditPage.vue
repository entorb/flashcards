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
    createEmptyCard: () => ({ voc: '', de: '', level: MIN_LEVEL, time: MAX_TIME }),
    fieldOrder: ['voc', 'de'],
    prepareCard: pending => {
      const voc = normalizeWhitespace(pending.voc)
      const de = normalizeWhitespace(pending.de)
      if (!(voc || de)) return null
      if (!voc) return { error: TEXT_DE.voc.cards.validationEnEmpty }
      if (!de) return { error: TEXT_DE.voc.cards.validationDeEmpty }
      return { card: { voc, de, level: MIN_LEVEL, time: MAX_TIME }, key: voc }
    },
    duplicateMessage: key => TEXT_DE.voc.cards.validationDuplicate.replace('{word}', key),
    getKey: card => card.voc
  })

onMounted(() => {
  // Initialize with a copy of current cards, sorted alphabetically
  editingCards.value = allCards.value
    .map(card => ({ ...card }))
    .sort((a, b) => a.voc.localeCompare(b.voc))
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleGoBack() {
  // Commit a card typed but not yet confirmed in the blank last row
  if (!commitNewCard(false)) return

  // Validate all cards before auto-saving
  for (const card of editingCards.value) {
    if (!card.voc.trim()) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.voc.cards.validationEnEmpty
      })
      return
    }
    if (!card.de.trim()) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.voc.cards.validationDeEmpty
      })
      return
    }
    if (card.level < MIN_LEVEL || card.level > MAX_LEVEL) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.shared.cardActions.invalidLevelError
          .replace('{min}', MIN_LEVEL.toString())
          .replace('{max}', MAX_LEVEL.toString())
      })
      return
    }
  }

  // Normalize whitespace from user inputs before saving
  for (const card of editingCards.value) {
    card.voc = normalizeWhitespace(card.voc)
    card.de = normalizeWhitespace(card.de)
  }

  // Reject duplicates (vocable must be unique per deck)
  const seen = new Set<string>()
  for (const card of editingCards.value) {
    if (seen.has(card.voc)) {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.voc.cards.validationDuplicate.replace('{word}', card.voc)
      })
      return
    }
    seen.add(card.voc)
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
  const header = 'voc\tde\tlevel\n'
  const tsvContent = editingCards.value.map(c => `${c.voc}\t${c.de}\t${c.level}`).join('\n')
  navigator.clipboard
    .writeText(header + tsvContent)
    .then(() => {
      exportButtonText.value = TEXT_DE.voc.cards.copied
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
    // Clipboard access failed (permission denied or other issue)
    // Offer manual paste as fallback
    showManualImportDialog()
  }
}

function showManualImportDialog() {
  $q.dialog({
    title: TEXT_DE.voc.cards.importDialogTitle,
    message: TEXT_DE.voc.cards.importDialogMessage,
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
      message: TEXT_DE.voc.cards.noDelimiterError
    })
    return
  }

  const { cards: newCards, delimiter } = parseResult

  if (newCards.length === 0) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.voc.cards.noCardsFoundError.replace('{delimiter}', delimiter)
    })
    return
  }

  editingCards.value = newCards
  $q.notify({
    type: 'positive',
    message: TEXT_DE.voc.cards.importSuccess.replace('{count}', newCards.length.toString())
  })
}

function onCardChange() {
  // Auto-save could be triggered here if needed
}
</script>

<template>
  <q-page
    class="q-pa-md card-edit-page"
    style="max-width: 1000px; margin: 0 auto"
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
        {{ TEXT_DE.voc.cards.editCardsTitle }}
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

      <div>{{ TEXT_DE.voc.cards.importHintExcel }}</div>

      <!-- Editable Cards Table -->
      <div style="overflow-x: auto">
        <q-list
          bordered
          separator
          style="min-width: 600px"
        >
          <!-- Header Row -->
          <q-item class="bg-grey-2">
            <q-item-section style="flex: 0 0 40%">
              <q-item-label class="text-weight-bold">
                {{
                  TEXT_DE.shared.words.vocable
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section style="flex: 0 0 40%">
              <q-item-label class="text-weight-bold">
                {{
                  TEXT_DE.shared.words.german
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section style="flex: 0 0 20%">
              <q-item-label class="text-weight-bold">
                {{ TEXT_DE.shared.words.level }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <!-- Data Rows -->
          <q-item
            v-for="(card, index) in rows"
            :key="index"
            data-cy="card-edit-item"
          >
            <q-item-section style="flex: 0 0 40%">
              <q-input
                v-model="card.voc"
                outlined
                dense
                :placeholder="TEXT_DE.voc.cards.vocPlaceholder"
                data-cy="card-voc-input"
                @update:model-value="onCardChange"
                @blur="onInputBlur(index)"
                @keydown="onInputKeydown(index, 'voc', $event)"
              />
            </q-item-section>
            <q-item-section style="flex: 0 0 40%">
              <q-input
                v-model="card.de"
                outlined
                dense
                :placeholder="TEXT_DE.voc.cards.dePlaceholder"
                data-cy="card-de-input"
                @update:model-value="onCardChange"
                @blur="onInputBlur(index)"
                @keydown="onInputKeydown(index, 'de', $event)"
              />
            </q-item-section>
            <q-item-section
              v-if="!isBlankRow(index)"
              style="flex: 0 0 20%"
            >
              <div class="row items-center q-gutter-xs">
                <q-input
                  v-model.number="card.level"
                  type="number"
                  outlined
                  dense
                  :min="MIN_LEVEL"
                  :max="MAX_LEVEL"
                  style="width: 60px"
                  data-cy="card-level-input"
                  @update:model-value="onCardChange"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  data-cy="delete-card-button"
                  @click="removeCard(index)"
                >
                  <q-tooltip>{{ TEXT_DE.shared.words.delete }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
            <q-item-section
              v-else
              style="flex: 0 0 20%"
            />
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.card-edit-page {
  min-height: 100vh;
  padding-bottom: 100px !important;
}
</style>
