<script setup lang="ts">
import { type AnswerResult, useGameTimer } from '@flashcards/shared'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import Flashcard from '../components/Flashcard.vue'
import { useGameStore } from '../composables/useGameStore'
import { MAX_TIME } from '../constants'
import { calculatePointsBreakdown } from '../services/pointsCalculation'
import type { PointsBreakdown } from '../types'

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
  discardGame,
  startGame
} = useGameStore()

// Use shared timer logic with maxTime
const { elapsedTime, stopTimer } = useGameTimer(currentCard, MAX_TIME)

const earnedPoints = ref<number>(0)
const pointsBreakdown = ref<PointsBreakdown | undefined>()

function handleAnswer(result: AnswerResult, answerTime: number) {
  stopTimer()
  const pointsBefore = points.value
  storeHandleAnswer(result, answerTime)
  earnedPoints.value = points.value - pointsBefore
  pointsBreakdown.value = calculatePointsBreakdown(
    result,
    currentCard.value,
    gameSettings.value,
    answerTime
  )
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
  if (gameSettings.value) {
    startGame(gameSettings.value)
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
      <div class="text-h6 text-weight-bold">
        {{ currentCardIndex + 1 }} / {{ gameCards.length }}
      </div>
    </div>

    <Flashcard
      v-if="currentCard"
      :key="currentCard.en"
      :card="currentCard"
      :all-cards="allCards"
      :settings="gameSettings!"
      :elapsed-time="elapsedTime"
      :earned-points="earnedPoints"
      :points-breakdown="pointsBreakdown"
      @answer="handleAnswer"
      @next="handleNextCard"
    />
  </q-page>
</template>
