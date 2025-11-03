<script setup lang="ts">
import { onUnmounted, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../composables/useGameStore'
import { useGameTimer, type AnswerResult } from '@flashcards/shared'
import {
  MAX_TIME,
  LEVEL_BONUS_NUMERATOR,
  MODE_MULTIPLIER_BLIND,
  MODE_MULTIPLIER_TYPING,
  CLOSE_ANSWER_PENALTY,
  LANGUAGE_BONUS_DE_EN,
  SPEED_BONUS_POINTS
} from '../constants'
import Flashcard from '../components/Flashcard.vue'

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

interface PointsBreakdown {
  basePoints: number
  modeMultiplier: number
  pointsBeforeBonus: number
  closeAdjustment: number
  languageBonus: number
  timeBonus: number
  totalPoints: number
}

const earnedPoints = ref<number>(0)
const pointsBreakdown = ref<PointsBreakdown | undefined>()

function calculatePointsBreakdown(result: AnswerResult, answerTime: number): PointsBreakdown {
  if (!currentCard.value || !gameSettings.value) {
    return {
      basePoints: 0,
      modeMultiplier: 1,
      pointsBeforeBonus: 0,
      closeAdjustment: 0,
      languageBonus: 0,
      timeBonus: 0,
      totalPoints: 0
    }
  }

  // Calculate base points from level
  const basePoints = LEVEL_BONUS_NUMERATOR - currentCard.value.level

  // Determine mode multiplier
  let modeMultiplier = 1
  if (gameSettings.value.mode === 'blind') {
    modeMultiplier = MODE_MULTIPLIER_BLIND
  } else if (gameSettings.value.mode === 'typing') {
    modeMultiplier = MODE_MULTIPLIER_TYPING
  }

  // Calculate points before bonuses
  let pointsBeforeBonus = basePoints * modeMultiplier

  // Apply close answer penalty (only for 'close' results)
  let closeAdjustment = 0
  if (result === 'close') {
    pointsBeforeBonus = Math.round(pointsBeforeBonus * CLOSE_ANSWER_PENALTY)
    closeAdjustment = pointsBeforeBonus - Math.round(basePoints * modeMultiplier)
  }

  // Apply language bonus (only for correct answers in DE->EN direction)
  let languageBonus = 0
  if (result === 'correct' && gameSettings.value.language === 'de-en') {
    languageBonus = LANGUAGE_BONUS_DE_EN
  }

  // Apply time bonus (only for correct answers in blind/typing modes)
  let timeBonus = 0
  if (result === 'correct' && answerTime < MAX_TIME) {
    const isBeatTime =
      (gameSettings.value.mode === 'blind' && answerTime < currentCard.value.time_blind) ||
      (gameSettings.value.mode === 'typing' && answerTime < currentCard.value.time_typing)
    if (isBeatTime) {
      timeBonus = SPEED_BONUS_POINTS
    }
  }

  const totalPoints =
    result === 'correct' || result === 'close' ? pointsBeforeBonus + languageBonus + timeBonus : 0

  return {
    basePoints,
    modeMultiplier,
    pointsBeforeBonus,
    closeAdjustment,
    languageBonus,
    timeBonus,
    totalPoints
  }
}

function handleAnswer(result: AnswerResult, answerTime: number) {
  stopTimer()
  const pointsBefore = points.value
  storeHandleAnswer(result, answerTime)
  earnedPoints.value = points.value - pointsBefore
  pointsBreakdown.value = calculatePointsBreakdown(result, answerTime)
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
        @click="handleGoHome"
        size="md"
        data-cy="back-button"
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
