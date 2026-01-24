<script setup lang="ts">
import {
  useGameTimer,
  TEXT_DE,
  useFeedbackTimers,
  useKeyboardContinue,
  MAX_TIME
} from '@flashcards/shared'
import { GameHeader, CardQuestion, CardInputSubmit } from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { type AnswerData, useGameStore } from '@/composables/useGameStore'
import { formatDisplayQuestion } from '@/utils/questionFormatter'

const router = useRouter()
const {
  gameCards,
  currentCardIndex,
  points,
  currentCard,
  gameSettings,
  handleAnswer: storeHandleAnswer,
  nextCard,
  finishGame: storeFinishGame,
  discardGame
} = useGameStore()

// Use shared timer logic
const { elapsedTime, stopTimer } = useGameTimer(currentCard)

// GamePage component state
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const answerData = ref<AnswerData | null>(null)

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
    answerData.value = null
    clearAllTimers()
  },
  { immediate: true }
)

function handleAnswer(data: AnswerData) {
  stopTimer()
  storeHandleAnswer(data)
}

function handleNextCard() {
  const isGameOver = nextCard()
  if (isGameOver) {
    stopTimer()
    storeFinishGame()
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

function submitAnswer() {
  if (userAnswer.value === null || userAnswer.value === undefined || !currentCard.value) return

  const userAnswerNum = Number.parseInt(String(userAnswer.value), 10)
  const isCorrect = userAnswerNum === currentCard.value.answer
  const timeTaken = elapsedTime.value

  let basePoints = 0
  let levelBonus = 0
  let speedBonus = 0

  if (isCorrect) {
    // Calculate points for correct answer
    const [x, y] = currentCard.value.question.split('x').map(s => Number.parseInt(s, 10))
    basePoints = Math.min(x, y)
    levelBonus = 6 - currentCard.value.level

    // Add speed bonus if last time < MAX_TIME and current time <= last time
    if (currentCard.value.time < MAX_TIME && timeTaken <= currentCard.value.time) {
      speedBonus = 1
    }
  }

  const totalPoints = basePoints + levelBonus + speedBonus

  answerData.value = {
    isCorrect,
    userAnswer: userAnswerNum,
    basePoints,
    levelBonus,
    speedBonus,
    totalPoints,
    timeTaken
  }

  showFeedback.value = true

  // Emit answer data to parent (now handled internally)
  handleAnswer(answerData.value)

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
          :show-correct-answer="showFeedback && !!answerData"
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

        <!-- Feedback Button Section (without large colored card) -->
        <div v-else-if="answerData">
          <!-- Show user answer vs correct answer comparison on wrong answers -->
          <q-card
            v-if="!answerData.isCorrect"
            class="q-mb-md"
            data-cy="wrong-answer-feedback"
          >
            <q-card-section class="text-center q-pa-md">
              <div class="row items-center justify-center text-h5">
                <span
                  class="text-negative text-weight-bold"
                  style="text-decoration: line-through; text-decoration-thickness: 3px"
                  >{{ answerData.userAnswer }}</span
                >
                <q-icon
                  name="arrow_forward"
                  size="sm"
                  class="q-mx-sm"
                />
                <span class="text-positive text-weight-bold text-h4">{{
                  currentCard?.answer
                }}</span>
              </div>
            </q-card-section>
          </q-card>

          <!-- Points display on correct answers -->
          <q-card
            v-else
            class="q-mb-md bg-positive-1"
            data-cy="correct-answer-feedback"
          >
            <q-card-section class="text-center q-pa-md">
              <div class="text-h5 text-weight-bold text-positive">
                {{ answerData.totalPoints }} {{ TEXT_DE.shared.words.points }}
              </div>
              <div class="text-caption q-mt-xs text-weight-medium text-grey-8">
                <span v-if="answerData.speedBonus > 0">
                  {{ answerData.levelBonus }} + {{ answerData.basePoints }} +
                  {{ answerData.speedBonus }} = {{ answerData.totalPoints }}
                </span>
                <span v-else>
                  {{ answerData.levelBonus }} + {{ answerData.basePoints }} =
                  {{ answerData.totalPoints }}
                </span>
              </div>
            </q-card-section>
          </q-card>

          <!-- Continue Button with icon -->
          <q-btn
            size="lg"
            class="full-width"
            :color="answerData.isCorrect ? 'positive' : 'negative'"
            :disable="isButtonDisabled || isEnterDisabled"
            :label="
              isButtonDisabled || isEnterDisabled
                ? `${TEXT_DE.shared.common.wait} ${buttonDisableCountdown}`
                : TEXT_DE.shared.common.continue
            "
            data-cy="continue-button"
            :icon="answerData.isCorrect ? 'check_circle' : 'cancel'"
            @click="handleContinue"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>
