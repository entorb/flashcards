<script setup lang="ts">
import {
  type AnswerResult,
  TEXT_DE,
  useFeedbackTimers,
  useKeyboardContinue
} from '@flashcards/shared'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'
import { WORD_DISPLAY_DURATION } from '../constants'
import { checkSpelling, calculateSpellingPoints } from '../utils/helpers'

const router = useRouter()
const {
  currentCard,
  gameCards,
  currentCardIndex,
  gameSettings,
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
const earnedPoints = ref(0)
const showFeedback = ref(false)
const readyToStart = ref(false) // For hidden mode: waiting for user to click GO
const showProceedButton = ref(false)
const proceedCountdown = ref(0) // Countdown for auto-proceed after correct answer

let countdownInterval: ReturnType<typeof setInterval> | null = null
let proceedCountdownInterval: ReturnType<typeof setInterval> | null = null

// Use shared feedback timers for blocking proceed on wrong/close answers
const { isButtonDisabled: isProceedDisabled, startButtonDisableTimer } = useFeedbackTimers()

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
  if (answerStatus.value === 'correct') return TEXT_DE.common.correct
  if (answerStatus.value === 'close') return TEXT_DE.common.closeMatch
  return TEXT_DE.common.incorrect
})

// Enable keyboard continue when feedback is shown and button is enabled
const canProceed = computed(
  () => showFeedback.value && showProceedButton.value && !isProceedDisabled.value
)
useKeyboardContinue(canProceed, proceedToNext)

// Enable Enter key to start hidden mode
const canStart = computed(() => readyToStart.value && !showFeedback.value)
useKeyboardContinue(canStart, startHiddenMode)

onMounted(() => {
  if (!currentCard.value) {
    router.push({ name: '/' })
    return
  }

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
})

function startHiddenMode() {
  readyToStart.value = false
  // Hide word and start countdown
  showWord.value = false
  showWordForDuration()
}

function showWordForDuration() {
  countdown.value = WORD_DISPLAY_DURATION

  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownInterval) clearInterval(countdownInterval)
      startTime.value = Date.now()
    }
  }, 1000)
}

function submitAnswer() {
  if (!currentCard.value || isSubmitting.value || showFeedback.value || !userInput.value.trim())
    return

  isSubmitting.value = true
  const answerTime = (Date.now() - startTime.value) / 1000

  const result = checkSpelling(userInput.value, currentCard.value.word)

  let resultType: AnswerResult
  if (result.isCorrect) {
    resultType = 'correct'
    handleAnswer('correct', false, answerTime)
  } else if (result.isCloseMatch) {
    resultType = 'close'
    handleAnswer('incorrect', true, answerTime)
  } else {
    resultType = 'incorrect'
    handleAnswer('incorrect', false, answerTime)
  }

  // Show feedback
  answerStatus.value = resultType

  // Calculate earned points
  earnedPoints.value = calculateSpellingPoints(
    result.isCorrect,
    result.isCloseMatch,
    currentCard.value.level
  )

  showFeedback.value = true
  showWord.value = true // Always show correct word in feedback
  showProceedButton.value = true

  if (resultType === 'correct') {
    // For correct answers: show countdown and auto-advance after 3 seconds
    proceedCountdown.value = 3
    if (proceedCountdownInterval) clearInterval(proceedCountdownInterval)

    proceedCountdownInterval = setInterval(() => {
      proceedCountdown.value--
      if (proceedCountdown.value <= 0) {
        if (proceedCountdownInterval) clearInterval(proceedCountdownInterval)
        proceedToNext()
      }
    }, 1000)
  } else {
    // For incorrect/close answers: disable button for 3 seconds
    startButtonDisableTimer()
  }
}

function proceedToNext() {
  // Clear any active countdown intervals
  if (proceedCountdownInterval) {
    clearInterval(proceedCountdownInterval)
    proceedCountdownInterval = null
  }

  showFeedback.value = false
  showProceedButton.value = false
  answerStatus.value = null
  earnedPoints.value = 0
  proceedCountdown.value = 0
  userInput.value = ''
  isSubmitting.value = false

  if (currentCardIndex.value >= gameCards.value.length - 1) {
    finishGame()
    router.push({ name: '/game-over' })
  } else {
    nextCard()

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
}

function quitGame() {
  discardGame()
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="close"
        data-cy="quit-button"
        @click="quitGame"
      />
      <div
        class="text-subtitle1"
        data-cy="card-counter"
      >
        {{ currentCardIndex + 1 }} / {{ gameCards.length }}
      </div>
    </div>

    <div class="column items-center q-gutter-md">
      <q-card class="full-width">
        <q-card-section class="text-center">
          <!-- Level Badge -->
          <div class="row justify-start items-center q-mb-sm">
            <q-badge
              color="primary"
              :label="`Level ${currentCard?.level || 1}`"
            />
          </div>
          <!-- Show word in copy mode -->
          <div
            v-if="showWord && gameSettings?.mode === 'copy'"
            class="text-h4 q-mb-md"
            data-cy="word-display"
          >
            {{ currentCard?.word }}
          </div>
          <!-- Show word in hidden mode before GO clicked -->
          <div
            v-else-if="showWord && readyToStart"
            class="text-h4"
            data-cy="word-display"
          >
            {{ currentCard?.word }}
          </div>
          <!-- Show countdown in hidden mode after GO clicked -->
          <div
            v-else-if="countdown > 0"
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
          <!-- eslint-disable vuejs-accessibility/no-autofocus -->
          <q-input
            v-if="!showFeedback && !readyToStart && countdown === 0"
            v-model="userInput"
            autofocus
            :placeholder="TEXT_DE.common.typePlaceholder"
            outlined
            class="q-mt-md"
            data-cy="spelling-input"
            :disable="isSubmitting"
            autocomplete="off"
            @keydown.enter.prevent="submitAnswer"
          >
            <template #prepend>
              <q-icon
                name="edit"
                color="primary"
              />
            </template>
            <template #append>
              <q-btn
                flat
                round
                dense
                icon="check"
                :disable="!userInput.trim() || isSubmitting"
                data-cy="submit-button"
                @click="submitAnswer"
              />
            </template>
          </q-input>
          <!-- eslint-enable vuejs-accessibility/no-autofocus -->
        </q-card-section>
      </q-card>

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
          <div
            v-if="earnedPoints > 0"
            class="text-h6 text-weight-bold"
            :class="`text-${feedbackColor}`"
          >
            +{{ earnedPoints }} {{ TEXT_DE.words.points }}
          </div>
        </q-card-section>
      </q-card>

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
          {{ TEXT_DE.common.wait }}
        </span>
        <span v-else>
          {{ TEXT_DE.common.continue }}
        </span>
      </q-btn>
    </div>
  </q-page>
</template>
