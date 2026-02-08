<script setup lang="ts">
import { TEXT_DE, MAX_LEVEL, MIN_LEVEL } from '@flashcards/shared'
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

  importCards(editingCards.value)
  router.push('/cards')
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

function addNewCard() {
  editingCards.value.push({
    voc: '',
    de: '',
    level: 1,
    time: 60
  })
}

function removeCard(index: number) {
  editingCards.value.splice(index, 1)
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
      <h2 class="q-ma-none text-h6">{{ TEXT_DE.voc.cards.editCardsTitle }}</h2>
      <div style="width: 40px" />
    </div>

    <div class="q-gutter-lg">
      <!-- Export and Import buttons -->
      <div class="row q-gutter-md items-center">
        <q-btn
          outline
          color="primary"
          icon="add"
          :label="TEXT_DE.voc.cards.addNewCard"
          no-caps
          data-cy="add-card-button"
          @click="addNewCard"
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
              <q-item-label class="text-weight-bold">{{
                TEXT_DE.shared.words.vocable
              }}</q-item-label>
            </q-item-section>
            <q-item-section style="flex: 0 0 40%">
              <q-item-label class="text-weight-bold">{{
                TEXT_DE.shared.words.german
              }}</q-item-label>
            </q-item-section>
            <q-item-section style="flex: 0 0 20%">
              <q-item-label class="text-weight-bold">{{ TEXT_DE.shared.words.level }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Data Rows -->
          <q-item
            v-for="(card, index) in editingCards"
            :key="index"
            data-cy="card-edit-item"
          >
            <q-item-section style="flex: 0 0 40%">
              <q-input
                v-model="card.voc"
                outlined
                dense
                :placeholder="TEXT_DE.voc.cards.vocPlaceholder"
                :data-cy="`card-voc-${index}`"
                @update:model-value="onCardChange"
              />
            </q-item-section>
            <q-item-section style="flex: 0 0 40%">
              <q-input
                v-model="card.de"
                outlined
                dense
                :placeholder="TEXT_DE.voc.cards.dePlaceholder"
                :data-cy="`card-de-${index}`"
                @update:model-value="onCardChange"
              />
            </q-item-section>
            <q-item-section style="flex: 0 0 20%">
              <div class="row items-center q-gutter-xs">
                <q-input
                  v-model.number="card.level"
                  type="number"
                  outlined
                  dense
                  :min="MIN_LEVEL"
                  :max="MAX_LEVEL"
                  style="width: 60px"
                  :data-cy="`card-level-${index}`"
                  @update:model-value="onCardChange"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  :data-cy="`delete-card-${index}`"
                  @click="removeCard(index)"
                >
                  <q-tooltip>{{ TEXT_DE.shared.words.delete }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
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
