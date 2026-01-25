<script setup lang="ts">
import {
  type AnswerResult,
  TEXT_DE,
  useFeedbackTimers,
  useKeyboardContinue,
  calculatePointsBreakdown,
  MAX_TIME
} from '@flashcards/shared'
import {
  GameHeader,
  CardQuestion,
  CardInputSubmit,
  CardPointsBreakdown
} from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'
import { POINTS_MODE_HIDDEN, WORD_DISPLAY_DURATION } from '../constants'
import { validateTypingAnswer } from '../utils/helpers'

const router = useRouter()
const {
  currentCard,
  gameCards,
  currentCardIndex,
  gameSettings,
  points,
  handleAnswer,
  nextCard,
  finishGame,
  discardGame
} = useGameStore()

const userInput = ref('')
const showWord = ref(false)
const countdown = ref(0)
const startTime = ref(0)
const isSubmitting = ref(false)
const answerStatus = ref<AnswerResult | null>(null)
const timeTaken = ref(0)
const showFeedback = ref(false)
const readyToStart = ref(false) // For hidden mode: waiting for user to click GO
const isHiddenModeActive = ref(false) // For hidden mode: word stays hidden after GO until next card
const showProceedButton = ref(false)
const totalCards = ref(0)

let countdownInterval: number | null = null

// Use shared feedback timers for blocking proceed on wrong/close answers
const {
  isButtonDisabled: isProceedDisabled,
  buttonDisableCountdown,
  startButtonDisableTimer
} = useFeedbackTimers()

const feedbackColor = computed(() => {
  if (answerStatus.value === 'correct') return 'positive'
  if (answerStatus.value === 'close') return 'warning'
  return 'negative'
})

const feedbackIcon = computed(() => {
  if (answerStatus.value === 'correct') return 'check_circle'
  if (answerStatus.value === 'close') return 'check_circle_outline'
  return 'cancel'
})

const feedbackMessage = computed(() => {
  if (answerStatus.value === 'correct') return TEXT_DE.shared.common.correct
  if (answerStatus.value === 'close') return TEXT_DE.shared.common.closeMatch
  return TEXT_DE.shared.common.incorrect
})

const pointsBreakdown = computed(() => {
  if (!answerStatus.value || answerStatus.value === 'incorrect') return null

  const difficultyPoints = gameSettings.value?.mode === 'hidden' ? POINTS_MODE_HIDDEN : 1
  const timeBonus =
    gameSettings.value?.mode === 'hidden' &&
    currentCard.value.time < MAX_TIME &&
    timeTaken.value <= currentCard.value.time

  return calculatePointsBreakdown({
    difficultyPoints,
    level: currentCard.value.level,
    timeBonus,
    closeAdjustment: answerStatus.value === 'close'
  })
})

// Enable keyboard continue when feedback is shown and button is enabled
const canProceed = computed(
  () => showFeedback.value && showProceedButton.value && !isProceedDisabled.value
)
useKeyboardContinue(canProceed, proceedToNext)

// Enable Enter key to start hidden mode
const canStart = computed(() => readyToStart.value && !showFeedback.value)
useKeyboardContinue(canStart, startHiddenMode)

// Handle Escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoHome()
  }
}

onMounted(() => {
  if (!currentCard.value) {
    router.push({ name: '/' })
    return
  }

  totalCards.value = gameCards.value.length

  // Initialize based on mode
  if (gameSettings.value?.mode === 'copy') {
    // Copy mode: word always visible, start timer immediately
    showWord.value = true
    startTime.value = Date.now()
  } else {
    // Hidden mode: show word first, wait for user to click GO button
    showWord.value = true
    readyToStart.value = true
  }

  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Clean up intervals
  if (countdownInterval !== null) {
    globalThis.clearInterval(countdownInterval)
  }
  // Clean up keyboard listener
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function startHiddenMode() {
  readyToStart.value = false
  isHiddenModeActive.value = true
  // Hide word and start countdown
  showWord.value = false
  showWordForDuration()
}

function showWordForDuration() {
  countdown.value = WORD_DISPLAY_DURATION

  countdownInterval = globalThis.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownInterval !== null) globalThis.clearInterval(countdownInterval)
      startTime.value = Date.now()
    }
  }, 1000) as unknown as number
}

function submitAnswer() {
  if (!currentCard.value || isSubmitting.value || showFeedback.value || !userInput.value.trim())
    return

  isSubmitting.value = true
  const answerTime = (Date.now() - startTime.value) / 1000

  const result = validateTypingAnswer(userInput.value, currentCard.value.word)

  let resultType: AnswerResult
  if (result === 'correct') {
    resultType = 'correct'
    handleAnswer('correct', answerTime)
  } else if (result === 'close') {
    resultType = 'close'
    handleAnswer('close', answerTime)
  } else {
    resultType = 'incorrect'
    handleAnswer('incorrect', answerTime)
  }

  // Show feedback
  answerStatus.value = resultType
  timeTaken.value = answerTime

  showFeedback.value = true
  showWord.value = true // Always show correct word in feedback
  showProceedButton.value = true

  if (resultType === 'correct') {
    // For correct answers: just show feedback, no auto-advance
  } else {
    // For incorrect/close answers: disable button for 3 seconds
    startButtonDisableTimer()
  }
}

function proceedToNext() {
  showFeedback.value = false
  showProceedButton.value = false
  answerStatus.value = null
  timeTaken.value = 0
  userInput.value = ''
  isSubmitting.value = false

  if (currentCardIndex.value + 1 >= totalCards.value) {
    finishGame()
    router.push({ name: '/game-over' })
    return
  }

  nextCard()
  isHiddenModeActive.value = false

  // Prepare for next word based on mode
  if (gameSettings.value?.mode === 'copy') {
    showWord.value = true
    startTime.value = Date.now()
  } else {
    // Hidden mode: show word and wait for user to click GO again
    showWord.value = true
    // Delay setting readyToStart to avoid Enter key triggering startHiddenMode
    setTimeout(() => {
      readyToStart.value = true
    }, 150)
  }
}

function handleGoHome() {
  discardGame()
  router.push({ name: '/' })
}
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
          v-if="(showFeedback || !isHiddenModeActive) && currentCard"
          :current-card="{
            level: currentCard.level,
            time: currentCard.time,
            answer: currentCard.word
          }"
          :display-question="showWord ? currentCard.word : ''"
          :show-correct-answer="false"
        />

        <!-- Countdown Display - shown during countdown in hidden mode -->
        <div
          v-if="countdown > 0"
          class="text-h2 row items-center justify-center q-gutter-sm"
        >
          <q-icon
            name="visibility_off"
            size="48px"
            color="grey-6"
          />
          {{ countdown }}
        </div>

        <!-- Input field - shown when ready to type (both modes) -->
        <div v-if="!showFeedback && !readyToStart && countdown === 0">
          <CardInputSubmit
            v-model="userInput"
            :button-disabled="isSubmitting"
            :on-submit="submitAnswer"
            input-type="text"
          />
        </div>

        <!-- GO Button for Hidden Mode -->
        <q-btn
          v-if="readyToStart && !showFeedback"
          color="primary"
          size="lg"
          label="Los!"
          icon="play_arrow"
          class="full-width q-mb-md"
          data-cy="start-countdown-button"
          @click="startHiddenMode"
        />

        <!-- Feedback Card - Show result after submission -->
        <q-card
          v-if="showFeedback && answerStatus"
          class="full-width q-mb-md"
          :class="[
            answerStatus === 'correct'
              ? 'bg-positive-1'
              : answerStatus === 'close'
                ? 'bg-warning-1'
                : 'bg-negative-1'
          ]"
        >
          <q-card-section class="text-center q-pa-md">
            <div class="row items-center justify-center q-mb-sm">
              <q-icon
                :name="feedbackIcon"
                :color="feedbackColor"
                size="48px"
              />
            </div>
            <div
              class="text-h5 text-weight-bold q-mb-xs"
              :class="`text-${feedbackColor}`"
            >
              {{ feedbackMessage }}
            </div>
          </q-card-section>
        </q-card>

        <CardPointsBreakdown
          :answer-status="answerStatus"
          :points-breakdown="pointsBreakdown"
        />

        <!-- Feedback Details - Show user input vs correct answer for wrong/close -->
        <q-card
          v-if="showFeedback && answerStatus !== 'correct'"
          class="full-width q-mb-md"
        >
          <q-card-section class="text-center q-pa-md">
            <!-- Close answer feedback -->
            <div v-if="answerStatus === 'close'">
              <div class="row items-center justify-center text-h6">
                <span
                  class="text-warning text-weight-bold"
                  style="text-decoration: line-through; text-decoration-thickness: 2px"
                  >{{ userInput }}</span
                >
                <q-icon
                  name="arrow_forward"
                  size="sm"
                  class="q-mx-sm"
                />
                <span class="text-positive text-weight-bold">{{ currentCard?.word }}</span>
              </div>
            </div>

            <!-- Incorrect answer feedback -->
            <div v-else-if="answerStatus === 'incorrect'">
              <div class="row items-center justify-center text-h6">
                <span
                  class="text-negative text-weight-bold"
                  style="text-decoration: line-through; text-decoration-thickness: 2px"
                  >{{ userInput }}</span
                >
                <q-icon
                  name="arrow_forward"
                  size="sm"
                  class="q-mx-sm"
                />
                <span class="text-positive text-weight-bold">{{ currentCard?.word }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Input field - Hidden when feedback is shown or waiting/counting -->

        <!-- Proceed Button - Shown after feedback -->
        <q-btn
          v-if="showFeedback && showProceedButton"
          size="lg"
          class="full-width"
          :color="feedbackColor"
          :disable="isProceedDisabled"
          :icon="feedbackIcon"
          data-cy="proceed-button"
          @click="proceedToNext"
        >
          <span v-if="isProceedDisabled">
            {{ TEXT_DE.shared.common.wait }} {{ buttonDisableCountdown }}
          </span>
          <span v-else>
            {{ TEXT_DE.shared.common.continue }}
          </span>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>
