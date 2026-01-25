<script setup lang="ts">
import {
  type AnswerStatus,
  calculatePointsBreakdown,
  MAX_TIME,
  useFeedbackTimers,
  useGameNavigation,
  useGameTimer,
  useKeyboardContinue
} from '@flashcards/shared'
import {
  CardFeedbackNegative,
  CardInputSubmit,
  CardNextCardButton,
  CardPointsBreakdown,
  CardQuestion,
  GameHeader
} from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '@/composables/useGameStore'
import { formatDisplayQuestion } from '@/utils/questionFormatter'

const router = useRouter()
const {
  gameCards,
  currentCardIndex,
  points,
  currentCard,
  gameSettings,
  handleAnswer,
  nextCard,
  finishGame: storeFinishGame,
  discardGame
} = useGameStore()

// GamePage component state
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const answerStatus = ref<AnswerStatus | null>(null)
const timeTaken = ref(0)
const userAnswerNum = ref<number | null>(null)
const basePoints = ref(0)
const isRecordTime = ref(false)

const pointsBreakdown = computed(() => {
  if (!answerStatus.value || answerStatus.value === 'incorrect') return null

  return calculatePointsBreakdown({
    difficultyPoints: basePoints.value,
    level: currentCard.value.level,
    timeBonus: isRecordTime.value,
    closeAdjustment: false
  })
})

// Use shared timer logic
const { elapsedTime, stopTimer } = useGameTimer(currentCard)

// Use shared navigation logic
const { handleNextCard, handleGoHome } = useGameNavigation({
  stopTimer,
  nextCard,
  finishGame: storeFinishGame,
  discardGame,
  router
})

// Use shared timer composable
const {
  isButtonDisabled,
  isEnterDisabled,
  buttonDisableCountdown,
  startAutoCloseTimer,
  startButtonDisableTimer,
  clearAllTimers
} = useFeedbackTimers()

const displayQuestion = computed(() => {
  return formatDisplayQuestion(currentCard.value?.question || '', gameSettings.value?.select)
})

// Calculate expected answer length for dynamic auto-submit
// (1 digit for 3×3=9, 2 digits for 6×8=48, 3 digits for 12×15=180)
const expectedAnswerLength = computed(() => {
  return String(currentCard.value?.answer || '').length
})

// Auto-submit after user enters expected number of digits
watch(userAnswer, newValue => {
  if (newValue !== null && newValue !== undefined && !showFeedback.value) {
    const valueStr = String(newValue)
    if (valueStr.length >= expectedAnswerLength.value) {
      submitAnswer()
    }
  }
})

// Use shared keyboard continue composable
const canProceed = computed(
  () => showFeedback.value && !isEnterDisabled.value && !isButtonDisabled.value
)
useKeyboardContinue(canProceed, handleContinue)

// Reset state when card changes
watch(
  () => currentCard.value,
  () => {
    userAnswer.value = null
    showFeedback.value = false
    answerStatus.value = null
    timeTaken.value = 0
    userAnswerNum.value = null
    basePoints.value = 0
    isRecordTime.value = false
    clearAllTimers()
  },
  { immediate: true }
)

function submitAnswer() {
  if (userAnswer.value === null || userAnswer.value === undefined || !currentCard.value) return

  const parsedUserAnswer = Number.parseInt(String(userAnswer.value), 10)
  const isCorrect = parsedUserAnswer === currentCard.value.answer
  const answerTime = elapsedTime.value

  let multiplier = 0
  let speedBonus = false

  if (isCorrect) {
    // Calculate points for correct answer
    const [x, y] = currentCard.value.question.split('x').map(s => Number.parseInt(s, 10))
    // multiplier is the smaller of the two factors
    multiplier = Math.min(x, y)

    // Add speed bonus if last time < MAX_TIME and current time <= last time
    if (currentCard.value.time < MAX_TIME && answerTime <= currentCard.value.time) {
      speedBonus = true
    }
  }

  // Set individual reactive refs
  answerStatus.value = isCorrect ? 'correct' : 'incorrect'
  timeTaken.value = answerTime
  userAnswerNum.value = parsedUserAnswer
  basePoints.value = multiplier
  isRecordTime.value = speedBonus

  showFeedback.value = true

  // Call handleAnswer directly
  stopTimer()
  handleAnswer(answerStatus.value, answerTime)

  if (isCorrect) {
    // Auto-close after configured duration for correct answers
    startAutoCloseTimer(handleContinue)
  } else {
    // Wrong answer: disable button and Enter key
    startButtonDisableTimer()
  }
}

function handleContinue() {
  clearAllTimers()
  showFeedback.value = false
  handleNextCard()
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
    router.push('/')
  }
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <q-page class="q-pa-md">
    <div style="max-width: 600px; margin: 0 auto">
      <GameHeader
        :current-index="currentCardIndex"
        :total-cards="gameCards.length"
        :points="points"
        @back="handleGoHome"
      />

      <div v-if="currentCard">
        <CardQuestion
          :current-card="{
            level: currentCard.level,
            time: currentCard.time,
            answer: String(currentCard.answer)
          }"
          :display-question="displayQuestion"
          :show-correct-answer="showFeedback && !!answerStatus"
        />

        <!-- Answer Input Section -->
        <div v-if="!showFeedback">
          <CardInputSubmit
            v-model="userAnswer"
            :button-disabled="isButtonDisabled"
            :on-submit="submitAnswer"
            input-type="numeric"
          />
        </div>

        <!-- Feedback Button Section -->
        <div v-else-if="showFeedback">
          <!-- Show user answer vs correct answer comparison on wrong answers -->
          <CardFeedbackNegative
            v-if="answerStatus === 'incorrect'"
            status="incorrect"
            :user-answer="String(userAnswerNum)"
            :correct-answer="String(currentCard?.answer)"
          />

          <CardPointsBreakdown
            :answer-status="answerStatus"
            :points-breakdown="pointsBreakdown"
          />

          <!-- Continue Button -->
          <CardNextCardButton
            :answer-data="{ isCorrect: answerStatus === 'correct' }"
            :is-button-disabled="isButtonDisabled"
            :is-enter-disabled="isEnterDisabled"
            :button-disable-countdown="buttonDisableCountdown"
            @click="handleContinue"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>
