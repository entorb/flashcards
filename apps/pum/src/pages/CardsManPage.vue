<script setup lang="ts">
import type { BaseCard } from '@flashcards/shared'
import { TEXT_DE, useCardFiltering, useResetCards } from '@flashcards/shared'
import { CardsListOfCards, CardsManLevelDistribution } from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import PumToggleButtons from '@/components/PumToggleButtons.vue'
import { useGameStore } from '@/composables/useGameStore'
import { DEFAULT_DIFFICULTIES, DEFAULT_OPERATIONS } from '@/constants'
import { filterCards } from '@/services/cardSelector'
import { loadCards, parseCardQuestion } from '@/services/storage'
import type { Card, Difficulty, Operation } from '@/types'
import { formatDisplayQuestion } from '@/utils/questionFormatter'

const router = useRouter()
const { showResetDialog } = useResetCards()
const { resetCards } = useGameStore()
const cards = ref<Card[]>([])

const selectedOperations = ref<Operation[]>([...DEFAULT_OPERATIONS])
const selectedDifficulties = ref<Difficulty[]>([...DEFAULT_DIFFICULTIES])

const operationButtons = [
  { value: 'plus', label: TEXT_DE.plusMinus.selection.plus, dataCy: 'filter-operation-plus' },
  { value: 'minus', label: TEXT_DE.plusMinus.selection.minus, dataCy: 'filter-operation-minus' }
]

const difficultyButtons = [
  {
    value: 'simple',
    label: TEXT_DE.plusMinus.selection.simple,
    dataCy: 'filter-difficulty-simple'
  },
  {
    value: 'medium',
    label: TEXT_DE.plusMinus.selection.medium,
    dataCy: 'filter-difficulty-medium'
  },
  {
    value: 'advanced',
    label: TEXT_DE.plusMinus.selection.advanced,
    dataCy: 'filter-difficulty-advanced'
  }
]

const filteredBySettings = computed(() =>
  filterCards(cards.value, {
    operations: selectedOperations.value,
    difficulties: selectedDifficulties.value,
    focus: 'weak'
  })
)

const { selectedLevel, handleLevelClick, filteredCards } = useCardFiltering(
  () => filteredBySettings.value
)

// Sort cards: plus before minus, then by X, then by Y
const sortedFilteredCards = computed(() => {
  const sorted = [...filteredCards.value]
  sorted.sort((a, b) => {
    const aQ = parseCardQuestion(a.question)
    const bQ = parseCardQuestion(b.question)
    // Plus (+) before minus (-)
    if (aQ.operator !== bQ.operator) {
      return aQ.operator === '+' ? -1 : 1
    }
    // Then by X
    if (aQ.x !== bQ.x) return aQ.x - bQ.x
    // Then by Y
    return aQ.y - bQ.y
  })
  return sorted
})

function getCardLabel(card: BaseCard): string {
  const c = card as unknown as { question: string; answer: number }
  return `${formatDisplayQuestion(c.question)} = ${c.answer}`
}

function getCardKey(card: BaseCard): string {
  const c = card as unknown as { question: string }
  return c.question
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

onMounted(() => {
  cards.value = loadCards()
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function resetCardsHandler() {
  showResetDialog(() => {
    resetCards()
    cards.value = loadCards()
  })
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <q-page
    class="q-pa-md"
    style="max-width: 1200px; margin: 0 auto"
  >
    <!-- Header with back button -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="goHome"
      >
        <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
      </q-btn>
      <div class="text-h6">
        {{ TEXT_DE.shared.words.cards }}
      </div>
      <div style="width: 40px" />
    </div>

    <!-- Filters -->
    <div class="q-mb-md">
      <PumToggleButtons
        :title="TEXT_DE.plusMinus.selection.operations"
        :buttons="operationButtons"
        :model-value="selectedOperations"
        @update:model-value="selectedOperations = $event as Operation[]"
      />

      <PumToggleButtons
        :title="TEXT_DE.plusMinus.selection.difficulties"
        :buttons="difficultyButtons"
        :model-value="selectedDifficulties"
        @update:model-value="selectedDifficulties = $event as Difficulty[]"
      />
    </div>

    <!-- Content -->
    <div>
      <!-- Level Distribution -->
      <CardsManLevelDistribution
        :cards="filteredBySettings"
        :selected-level="selectedLevel"
        class="q-mb-md"
        @reset="resetCardsHandler"
        @level-click="handleLevelClick"
      />

      <!-- Filtered Cards List -->
      <CardsListOfCards
        v-if="selectedLevel !== null"
        :all-cards="filteredBySettings"
        :cards-to-show="sortedFilteredCards"
        :selected-level="selectedLevel"
        :get-label="getCardLabel"
        :get-key="getCardKey"
      />
    </div>
  </q-page>
</template>
