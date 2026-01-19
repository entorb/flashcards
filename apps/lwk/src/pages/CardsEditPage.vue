<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'
import { MAX_LEVEL, MAX_TIME, MIN_LEVEL, MIN_TIME } from '../constants'
import type { Card } from '../types'

const router = useRouter()
const $q = useQuasar()
const { allCards, importCards } = useGameStore()

// Create a working copy of cards for editing
const editingCards = ref<Card[]>([])
const exportButtonText = ref<string>(TEXT_DE.lwk.cards.export)
const hasChanges = ref(false)

onMounted(() => {
  // Initialize with a copy of current cards
  editingCards.value = allCards.value.map(card => ({ ...card }))
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleGoBack() {
  if (hasChanges.value) {
    $q.dialog({
      title: TEXT_DE.lwk.cards.unsavedChangesTitle,
      message: TEXT_DE.lwk.cards.unsavedChangesMessage,
      cancel: true
    }).onOk(() => {
      router.push('/cards')
    })
  } else {
    router.push('/cards')
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoBack()
  }
}

function handleExport() {
  const header = 'word\tlevel\ttime\n'
  const tsvContent = editingCards.value.map(c => `${c.word}\t${c.level}\t${c.time}`).join('\n')
  navigator.clipboard
    .writeText(header + tsvContent)
    .then(() => {
      exportButtonText.value = TEXT_DE.lwk.cards.copied
      setTimeout(() => (exportButtonText.value = TEXT_DE.lwk.cards.export), 2000)
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: TEXT_DE.lwk.cards.clipboardError
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

function parseCardFromLine(line: string): Card | null {
  if (!line || line.startsWith('word')) return null

  const parts = line.split('\t')
  const word = parts[0]?.trim()

  if (!word) return null

  // Parse level (default to 1 if missing/invalid)
  let level = MIN_LEVEL
  if (parts[1]) {
    const parsedLevel = Number.parseInt(parts[1], 10)
    if (!Number.isNaN(parsedLevel) && parsedLevel >= MIN_LEVEL && parsedLevel <= MAX_LEVEL) {
      level = parsedLevel
    }
  }

  // Parse time (default to MAX_TIME if missing/invalid)
  let time = MAX_TIME
  if (parts[2]) {
    const parsedTime = Number.parseFloat(parts[2])
    if (!Number.isNaN(parsedTime) && parsedTime >= MIN_TIME && parsedTime <= MAX_TIME) {
      time = parsedTime
    }
  }

  return { word, level, time }
}

function processImportText(text: string) {
  if (!text) {
    $q.notify({ type: 'negative', message: TEXT_DE.lwk.cards.emptyTextError })
    return
  }

  const lines = text.split('\n').map(line => line.trim())
  const newCards: Card[] = []

  for (const line of lines) {
    const card = parseCardFromLine(line)
    if (card) {
      newCards.push(card)
    }
  }

  if (newCards.length === 0) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.noWordsFoundError
    })
    return
  }

  editingCards.value = newCards
  hasChanges.value = true
  $q.notify({
    type: 'positive',
    message: TEXT_DE.lwk.cards.importSuccess.replace('{count}', newCards.length.toString())
  })
}

function handleSave() {
  // Validate cards
  const invalidCard = editingCards.value.find(card => !card.word.trim())
  if (invalidCard) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.lwk.cards.validationWordEmpty
    })
    return
  }

  // Import cards (replaces all existing cards)
  importCards(editingCards.value)
  hasChanges.value = false

  $q.notify({
    type: 'positive',
    message: TEXT_DE.lwk.cards.saveSuccess
  })

  router.push('/cards')
}

function handleAddCard() {
  editingCards.value.push({
    word: '',
    level: MIN_LEVEL,
    time: MAX_TIME
  })
  hasChanges.value = true
}

function handleRemoveCard(index: number) {
  editingCards.value.splice(index, 1)
  hasChanges.value = true
}

function onCardChange() {
  hasChanges.value = true
}

function getLevelOptions() {
  const options = []
  for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
    options.push({ label: i.toString(), value: i })
  }
  return options
}

function getTimeOptions() {
  const options = []
  for (let i = MIN_TIME; i <= MAX_TIME; i += 5) {
    options.push({ label: `${i}s`, value: i })
  }
  // Ensure MAX_TIME is included
  if (!options.some(opt => opt.value === MAX_TIME)) {
    options.push({ label: `${MAX_TIME}s`, value: MAX_TIME })
  }
  return options
}
</script>

<template>
  <q-page
    class="q-pa-md cards-edit-page"
    style="max-width: 900px; margin: 0 auto"
  >
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="handleGoBack"
      />
      <div class="text-h6">{{ TEXT_DE.lwk.cards.editCardsTitle }}</div>
      <div style="width: 40px"></div>
    </div>

    <!-- Action buttons -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        color="primary"
        icon="add"
        :label="TEXT_DE.lwk.cards.addNewCard"
        data-cy="add-card-button"
        @click="handleAddCard"
      />
      <q-btn
        outline
        color="primary"
        icon="file_download"
        :label="exportButtonText"
        data-cy="export-button"
        @click="handleExport"
      />
      <q-btn
        outline
        color="primary"
        icon="file_upload"
        :label="TEXT_DE.lwk.cards.import"
        data-cy="import-button"
        @click="handleImport"
      />
    </div>

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

            <!-- Time select -->
            <q-select
              v-model="card.time"
              dense
              outlined
              :options="getTimeOptions()"
              emit-value
              map-options
              label="Zeit"
              style="width: 100px"
              data-cy="time-select"
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

    <!-- Save button -->
    <q-btn
      class="full-width"
      color="positive"
      icon="save"
      :label="TEXT_DE.lwk.cards.save"
      :disable="!hasChanges"
      data-cy="save-button"
      @click="handleSave"
    />
  </q-page>
</template>

<style scoped>
.cards-edit-page {
  padding-bottom: 100px;
}
</style>
