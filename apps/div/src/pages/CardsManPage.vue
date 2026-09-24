<script setup lang="ts">
import type { BaseCard } from "@flashcards/shared"
import { TEXT_DE, useCardFiltering, useResetCards } from "@flashcards/shared"
import {
  CardsListOfCards,
  CardsManLevelDistribution,
  CardsTimeHistogram,
} from "@flashcards/shared/components"
import { getTimeFilterListTitle } from "@flashcards/shared/utils"
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useRouter } from "vue-router"

import { useGameStore } from "@/composables/useGameStore"
import { getVirtualCards, loadCards, parseCardQuestion } from "@/services/storage"
import type { Card } from "@/types"

const router = useRouter()
const { showResetDialog } = useResetCards()
const { resetCards } = useGameStore()
const cards = ref<Card[]>([])

const cardsInRange = computed(() => getVirtualCards(cards.value))

const {
  selectedLevel,
  selectedTimeBucket,
  handleLevelClick,
  handleTimeBucketClick,
  filteredCards,
} = useCardFiltering(() => cardsInRange.value)

const listTitle = computed(() => {
  if (selectedTimeBucket.value !== null) {
    return getTimeFilterListTitle(selectedTimeBucket.value)
  }
  return undefined
})

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
  return `${c.question.replace(":", " : ")} = ${c.answer}`
}

function getCardKey(card: BaseCard): string {
  const c = card as unknown as { question: string }
  return c.question
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    goHome()
  }
}

onMounted(() => {
  cards.value = loadCards()
  globalThis.addEventListener("keydown", handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener("keydown", handleKeyDown)
})

function resetCardsHandler() {
  showResetDialog(() => {
    resetCards()
    cards.value = loadCards()
  })
}

function goHome() {
  void router.push({ name: "/HomePage" })
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

      <!-- Time Histogram -->
      <CardsTimeHistogram
        :cards="cardsInRange"
        :selected-bucket="selectedTimeBucket"
        class="q-mb-md"
        @bucket-click="handleTimeBucketClick"
      />

      <!-- Filtered Cards List -->
      <CardsListOfCards
        v-if="selectedLevel !== null || selectedTimeBucket !== null"
        :all-cards="cardsInRange"
        :cards-to-show="sortedFilteredCards"
        :selected-level="selectedLevel"
        :get-label="getCardLabel"
        :get-key="getCardKey"
        :title="listTitle ?? ''"
      />
    </div>
  </q-page>
</template>
