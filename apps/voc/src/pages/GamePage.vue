<script setup lang="ts">
import { useGameTimer, MAX_TIME } from '@flashcards/shared'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import FlashCard from '../components/FlashCard.vue'
import { useGameStore } from '../composables/useGameStore'
import type { AnswerData } from '../types'

const router = useRouter()
const {
  allCards,
  gameCards,
  gameSettings,
  currentCardIndex,
  points,
  currentCard,
  handleAnswer: storeHandleAnswer,
  nextCard,
  finishGame,
  discardGame
} = useGameStore()

// Use shared timer logic with maxTime
const { stopTimer } = useGameTimer(currentCard, MAX_TIME)

function handleAnswer(data: AnswerData) {
  stopTimer()
  storeHandleAnswer(data.result, data.answerTime)
}

function handleNextCard() {
  const isGameOver = nextCard()
  if (isGameOver) {
    stopTimer()
    finishGame()
    router.push({ name: '/game-over' })
  }
}

function handleGoHome() {
  stopTimer()
  discardGame()
  router.push({ name: '/' })
}

// Handle Escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoHome()
  }
}

onMounted(() => {
  // Redirect home if there's no game in progress and no settings
  // This handles the case where user accessed /game directly without starting a game
  if (gameCards.value.length === 0 && !gameSettings.value) {
    router.push({ name: '/' })
  }
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <q-page
    class="q-pa-md"
    style="max-width: 600px; margin: 0 auto"
  >
    <!-- Header with Back Button and Game Progress -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        size="md"
        data-cy="back-button"
        @click="handleGoHome"
      />
      <div class="text-h6 text-weight-bold">
        <q-icon
          name="emoji_events"
          color="amber"
          size="24px"
        />
        {{ points }}
      </div>
      <div
        class="text-h6 text-weight-bold"
        data-cy="card-counter"
      >
        {{ currentCardIndex + 1 }} / {{ gameCards.length }}
      </div>
    </div>

    <FlashCard
      v-if="currentCard"
      :key="currentCard.voc"
      :card="currentCard"
      :all-cards="allCards"
      :settings="gameSettings!"
      @answer="handleAnswer"
      @next="handleNextCard"
    />
  </q-page>
</template>
