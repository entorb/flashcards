<script setup lang="ts">
import type { BaseCard } from '@flashcards/shared'
import { TEXT_DE, useCardFiltering, useResetCards } from '@flashcards/shared'
import { CardsListOfCards, CardsManLevelDistribution } from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '@/composables/useGameStore'
import { DEFAULT_RANGE } from '@/constants'
import {
  getVirtualCardsForRange,
  loadCards,
  loadRange,
  parseCardQuestion,
  saveRange,
  toggleFeature50
} from '@/services/storage'
import type { Card } from '@/types'

const router = useRouter()
const { showResetDialog } = useResetCards()
const { resetCards } = useGameStore()
const cards = ref<Card[]>([])
const range = ref<number[]>([...DEFAULT_RANGE])

const cardsInRange = computed(() => getVirtualCardsForRange(range.value))

const { selectedLevel, handleLevelClick, filteredCards } = useCardFiltering(
  () => cardsInRange.value
)

const sortedFilteredCards = computed(() => {
  const sorted = [...filteredCards.value]
  sorted.sort((a, b) => {
    const aQ = parseCardQuestion(a.question)
    const bQ = parseCardQuestion(b.question)
    if (aQ.divisor !== bQ.divisor) return aQ.divisor - bQ.divisor
    return aQ.dividend - bQ.dividend
  })
  return sorted
})

function getCardLabel(card: BaseCard): string {
  const c = card as unknown as { question: string; answer: number }
  return `${c.question.replace(':', ' : ')} = ${c.answer}`
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
  range.value = loadRange()
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

function toggleExtended() {
  const newRange = toggleFeature50(range.value)
  range.value = newRange
  saveRange(newRange)
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

    <!-- Content -->
    <div>
      <!-- Level Distribution -->
      <CardsManLevelDistribution
        :cards="cardsInRange"
        :selected-level="selectedLevel"
        class="q-mb-md"
        @reset="resetCardsHandler"
        @level-click="handleLevelClick"
      />

      <!-- Filtered Cards List -->
      <CardsListOfCards
        v-if="selectedLevel !== null"
        :all-cards="cardsInRange"
        :cards-to-show="sortedFilteredCards"
        :selected-level="selectedLevel"
        :get-label="getCardLabel"
        :get-key="getCardKey"
      />

      <!-- Extended Cards Section -->
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-md text-grey-8">
            <q-icon
              name="extension"
              size="18px"
              class="q-mr-xs"
            />
            {{ TEXT_DE.multiply.extendedCards.title }}
          </div>
          <div class="row items-center q-gutter-md">
            <!-- ≤50 Toggle Button -->
            <q-btn
              :pressed="range.some(n => n > 9)"
              unelevated
              label="≤50"
              data-cy="feature-50-toggle"
              :color="range.some(n => n > 9) ? 'primary' : 'grey-5'"
              @click="toggleExtended"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

