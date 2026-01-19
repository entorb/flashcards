<script setup lang="ts">
import {
  type AnswerResult,
  TEXT_DE,
  useFeedbackTimers,
  useKeyboardContinue
} from '@flashcards/shared'
import { shuffleArray } from '@flashcards/shared/utils'
import { computed, ref, watch } from 'vue'

import { MAX_TIME } from '../constants'
import { calculatePointsBreakdown } from '../services/pointsCalculation'
import type { AnswerData, Card, GameSettings, PointsBreakdown } from '../types'
import { validateTypingAnswer } from '../utils/helpers'

interface Props {
  card: Card
  allCards: Card[]
  settings: GameSettings
}

const props = defineProps<Props>()
const emit = defineEmits<{
  answer: [data: AnswerData]
  next: []
}>()

const showAnswer = ref(false)
const answerStatus = ref<AnswerResult | null>(null)
const userAnswer = ref('')
const options = ref<string[]>([])
const feedbackData = ref<{
  type: 'simple' | 'close' | 'typing-incorrect'
  message?: string
  userInput?: string
  correctText?: string
  highlightedText?: string
}>({ type: 'simple' })
const showProceedButton = ref(false)
const startTime = ref<number>(0)
const earnedPoints = ref<number>(0)
const pointsBreakdown = ref<PointsBreakdown | null>(null)

// Use shared timer composable
const {
  isButtonDisabled: isProceedDisabled,
  startAutoCloseTimer,
  startButtonDisableTimer
} = useFeedbackTimers()

// Use shared keyboard continue composable
const canProceed = computed(() => showProceedButton.value && !isProceedDisabled.value)
useKeyboardContinue(canProceed, () => emit('next'))

// Compute question and answer based on language direction
const question = computed(() => {
  return props.settings.language === 'voc-de' ? props.card.voc : props.card.de
})

const correctAnswer = computed(() => {
  return props.settings.language === 'voc-de' ? props.card.de : props.card.voc
})

const targetLang = computed(() => {
  return props.settings.language === 'voc-de' ? 'de' : 'voc'
})

// Determine which time to display based on mode
const displayTime = computed(() => {
  if (props.settings.mode === 'blind') {
    return props.card.time_blind
  } else if (props.settings.mode === 'typing') {
    return props.card.time_typing
  }
  return MAX_TIME // Don't show time for multiple-choice
})

// Generate options for multiple choice
watch(
  () => [props.card, props.settings.mode],
  () => {
    if (props.settings.mode === 'multiple-choice') {
      const otherAnswers = props.allCards
        .filter(c => c.voc !== props.card.voc)
        .map(c => c[targetLang.value])

      const shuffledOthers = shuffleArray(otherAnswers)
      const incorrectOptions = [...new Set(shuffledOthers)].slice(0, 3)

      options.value = shuffleArray([...incorrectOptions, correctAnswer.value])
    }
  },
  { immediate: true }
)

// Reset state when card changes and start timer
watch(
  () => props.card,
  () => {
    showAnswer.value = false
    answerStatus.value = null
    userAnswer.value = ''
    feedbackData.value = { type: 'simple' }
    showProceedButton.value = false
    startTime.value = Date.now()
  },
  { immediate: true }
)

function processAnswer(result: AnswerResult) {
  if (answerStatus.value) return

  // Calculate answer time in seconds
  const answerTime = (Date.now() - startTime.value) / 1000

  // Calculate points breakdown
  pointsBreakdown.value = calculatePointsBreakdown(result, props.card, props.settings, answerTime)
  earnedPoints.value = pointsBreakdown.value.totalPoints

  // Emit complete answer data to parent
  emit('answer', {
    result,
    answerTime,
    earnedPoints: earnedPoints.value,
    pointsBreakdown: pointsBreakdown.value
  })

  answerStatus.value = result
  showAnswer.value = true

  // Always show proceed button for all answer types
  showProceedButton.value = true

  if (result === 'correct') {
    // For correct answers: auto-advance after 3 seconds, but allow manual continue
    startAutoCloseTimer(() => emit('next'))
  } else {
    // For incorrect/close answers: disable button for 3 seconds
    startButtonDisableTimer()

    if (result === 'close') {
      const mainCorrectAnswer = correctAnswer.value.split('/')[0].trim()
      feedbackData.value = {
        type: 'close',
        userInput: userAnswer.value,
        correctText: mainCorrectAnswer
      }
    } else if (props.settings.mode === 'typing') {
      feedbackData.value = {
        type: 'typing-incorrect',
        userInput: userAnswer.value,
        correctText: correctAnswer.value
      }
    }
  }
}

function handleMultipleChoiceSubmit(option: string) {
  processAnswer(option === correctAnswer.value ? 'correct' : 'incorrect')
}

function handleBlindSubmit(correct: boolean) {
  if (correct) {
    processAnswer('correct')
  } else {
    processAnswer('incorrect')
  }
}

function handleTypingSubmit() {
  if (answerStatus.value) return

  const result = validateTypingAnswer(
    userAnswer.value,
    correctAnswer.value,
    props.settings.language
  )
  processAnswer(result)
}
</script>

<template>
  <div class="flashcard-container">
    <!-- Question Card - 1x1 style -->
    <q-card class="q-mb-md">
      <q-card-section class="text-center q-pa-md">
        <div class="row justify-between items-center q-mb-sm">
          <q-badge
            color="primary"
            :label="`Level ${card.level}`"
          />
          <div
            v-if="displayTime < MAX_TIME"
            class="text-caption text-weight-medium text-grey-7"
          >
            {{ displayTime.toFixed(1) }}s
          </div>
        </div>
        <div
          class="q-my-md text-weight-bold text-h4"
          data-cy="game-page-question"
        >
          {{ question }}
          <!-- Show answer if revealed -->
          <template v-if="showAnswer">
            =
            <output
              class="text-positive"
              :aria-label="`Correct answer: ${correctAnswer}`"
            >
              {{ correctAnswer }}
            </output>
          </template>
        </div>
      </q-card-section>
    </q-card>

    <!-- Input Section -->
    <div class="q-mt-md">
      <!-- Feedback Details (without big colored card) -->
      <q-card
        v-if="answerStatus && answerStatus !== 'correct' && feedbackData.type !== 'simple'"
        class="q-mb-md"
      >
        <q-card-section class="text-center q-pa-md">
          <!-- Close answer feedback -->
          <div v-if="feedbackData.type === 'close'">
            <div class="row items-center justify-center text-h6">
              <span
                class="text-warning text-weight-bold"
                style="text-decoration: line-through; text-decoration-thickness: 2px"
                >{{ feedbackData.userInput }}</span
              >
              <q-icon
                name="arrow_forward"
                size="sm"
                class="q-mx-sm"
              />
              <span class="text-positive text-weight-bold">{{ feedbackData.correctText }}</span>
            </div>
          </div>

          <!-- Typing mode incorrect feedback -->
          <div v-else-if="feedbackData.type === 'typing-incorrect'">
            <div class="row items-center justify-center text-h6">
              <span
                class="text-negative text-weight-bold"
                style="text-decoration: line-through; text-decoration-thickness: 2px"
                >{{ feedbackData.userInput }}</span
              >
              <q-icon
                name="arrow_forward"
                size="sm"
                class="q-mx-sm"
              />
              <span class="text-positive text-weight-bold">{{ feedbackData.correctText }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Points display on correct and close answers -->
      <q-card
        v-if="(answerStatus === 'correct' || answerStatus === 'close') && pointsBreakdown"
        class="q-mb-md"
        :class="[answerStatus === 'correct' ? 'bg-positive-1' : 'bg-warning-1']"
      >
        <q-card-section class="text-center q-pa-md">
          <div
            class="text-h5 text-weight-bold"
            :class="[answerStatus === 'correct' ? 'text-positive' : 'text-warning']"
          >
            +{{ pointsBreakdown.totalPoints }} {{ TEXT_DE.words.points }}
          </div>
          <div class="text-caption q-mt-xs text-weight-medium text-grey-8">
            <span>
              {{ pointsBreakdown.basePoints }} × {{ pointsBreakdown.modeMultiplier }}
              <span v-if="answerStatus === 'close'">
                {{ pointsBreakdown.closeAdjustment }}
              </span>
              <span v-if="pointsBreakdown.languageBonus > 0">
                + {{ pointsBreakdown.languageBonus }}
              </span>
              <span v-if="pointsBreakdown.timeBonus > 0"> + {{ pointsBreakdown.timeBonus }} </span>
              = {{ pointsBreakdown.totalPoints }}
            </span>
          </div>
        </q-card-section>
      </q-card>

      <!-- Continue Button with icon when feedback is shown -->
      <q-btn
        v-if="answerStatus && showProceedButton"
        size="lg"
        class="full-width q-mb-md"
        :color="
          answerStatus === 'correct'
            ? 'positive'
            : answerStatus === 'close'
              ? 'warning'
              : 'negative'
        "
        :disable="isProceedDisabled"
        :label="isProceedDisabled ? `${TEXT_DE.common.wait}` : TEXT_DE.common.continue"
        data-cy="continue-button"
        :icon="
          answerStatus === 'correct'
            ? 'check_circle'
            : answerStatus === 'close'
              ? 'warning'
              : 'cancel'
        "
        @click="emit('next')"
      />

      <!-- Multiple Choice -->
      <div
        v-else-if="settings.mode === 'multiple-choice'"
        class="row q-col-gutter-sm"
      >
        <div
          v-for="option in options"
          :key="option"
          class="col-6"
        >
          <q-btn
            :disable="!!answerStatus"
            outline
            color="grey-8"
            :label="option"
            no-caps
            class="full-width"
            data-cy="multiple-choice-option"
            @click="handleMultipleChoiceSubmit(option)"
          />
        </div>
      </div>

      <!-- Blind Mode -->
      <div v-else-if="settings.mode === 'blind'">
        <q-btn
          v-if="!showAnswer"
          color="primary"
          :label="TEXT_DE.voc.game.revealAnswer"
          no-caps
          class="full-width"
          data-cy="reveal-answer-button"
          @click="showAnswer = true"
        />
        <div
          v-else
          class="q-gutter-sm"
        >
          <p class="text-center text-grey-7 q-mb-sm">
            {{ TEXT_DE.voc.game.wasYourAnswerCorrect }}
          </p>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-btn
                :disable="!!answerStatus"
                color="negative"
                :label="TEXT_DE.common.no"
                no-caps
                class="full-width"
                data-cy="blind-no-button"
                @click="handleBlindSubmit(false)"
              />
            </div>
            <div class="col-6">
              <q-btn
                :disable="!!answerStatus"
                color="positive"
                :label="TEXT_DE.common.yes"
                no-caps
                class="full-width"
                data-cy="blind-yes-button"
                @click="handleBlindSubmit(true)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Mode -->
      <q-form
        v-else-if="settings.mode === 'typing' && !answerStatus"
        @submit.prevent="handleTypingSubmit"
      >
        <!-- eslint-disable vuejs-accessibility/no-autofocus -->
        <q-input
          v-model="userAnswer"
          autofocus
          outlined
          :placeholder="TEXT_DE.common.typePlaceholder"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          class="q-mb-sm"
          data-cy="typing-input"
        />
        <!-- eslint-enable vuejs-accessibility/no-autofocus -->
        <q-btn
          color="primary"
          size="lg"
          class="full-width q-mb-md"
          :label="TEXT_DE.common.check"
          :disable="userAnswer.trim() === ''"
          icon="check"
          type="submit"
          data-cy="check-answer-button"
        />
      </q-form>
    </div>
  </div>
</template>

<style scoped>
.flashcard-container {
  width: 100%;
  max-width: 500px;
}
</style>
