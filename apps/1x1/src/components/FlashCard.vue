<script setup lang="ts">
import { TEXT_DE, useFeedbackTimers, useKeyboardContinue, MAX_TIME } from '@flashcards/shared'
import { computed, nextTick, ref, watch } from 'vue'

import type { AnswerData, Card, SelectionType } from '@/types'
import { formatDisplayQuestion } from '@/utils/questionFormatter'

interface Props {
  card: Card
  elapsedTime: number
  selection?: SelectionType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  answer: [data: AnswerData]
  next: []
}>()

const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const answerData = ref<AnswerData | null>(null)
const answerInput = ref<HTMLInputElement | null>(null)

// Use shared timer composable
const {
  isButtonDisabled,
  isEnterDisabled,
  startAutoCloseTimer,
  startButtonDisableTimer,
  clearAllTimers
} = useFeedbackTimers()

const displayQuestion = computed(() => {
  return formatDisplayQuestion(props.card.question, props.selection)
})

// Calculate expected answer length for dynamic auto-submit
// (1 digit for 3×3=9, 2 digits for 6×8=48, 3 digits for 12×15=180)
const expectedAnswerLength = computed(() => {
  return String(props.card.answer).length
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
  () => props.card,
  () => {
    userAnswer.value = null
    showFeedback.value = false
    answerData.value = null
    clearAllTimers()
    nextTick(() => {
      nextTick(() => {
        answerInput.value?.focus()
      })
    })
  },
  { immediate: true }
)

function submitAnswer() {
  if (userAnswer.value === null || userAnswer.value === undefined) return

  const isCorrect = userAnswer.value === props.card.answer
  const timeTaken = props.elapsedTime

  let basePoints = 0
  let levelBonus = 0
  let speedBonus = 0

  if (isCorrect) {
    // Calculate points for correct answer
    const [x, y] = props.card.question.split('x').map(s => Number.parseInt(s, 10))
    basePoints = Math.min(x, y)
    levelBonus = 6 - props.card.level

    // Add speed bonus if last time < MAX_TIME and current time <= last time
    if (props.card.time < MAX_TIME && timeTaken <= props.card.time) {
      speedBonus = 1
    }
  }

  const totalPoints = basePoints + levelBonus + speedBonus

  answerData.value = {
    isCorrect,
    userAnswer: userAnswer.value,
    basePoints,
    levelBonus,
    speedBonus,
    totalPoints,
    timeTaken
  }

  showFeedback.value = true

  // Emit answer data to parent
  emit('answer', answerData.value)

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
  emit('next')
}
</script>

<template>
  <div class="flashcard-container">
    <!-- Question Card -->
    <q-card class="q-mb-md">
      <q-card-section class="text-center q-pa-md">
        <div class="row justify-between items-center q-mb-sm">
          <q-badge
            color="primary"
            :label="`Level ${card.level}`"
            data-cy="card-level"
          />
          <div
            v-if="card.time < MAX_TIME"
            class="text-caption text-weight-medium text-grey-7"
            data-cy="card-time"
          >
            {{ card.time.toFixed(1) }}s
          </div>
        </div>
        <div
          class="q-my-md text-weight-bold"
          :class="$q.screen.gt.xs ? 'text-h2' : 'text-h3'"
          data-cy="question-display"
        >
          {{ displayQuestion }}

          <!-- Show correct answer after submission -->
          <template v-if="showFeedback && answerData">
            =
            <output
              class="text-positive"
              :aria-label="`Correct answer: ${card.answer}`"
            >
              {{ card.answer }}
            </output>
          </template>
        </div>
      </q-card-section>
    </q-card>

    <!-- Answer Input Section -->
    <div v-if="!showFeedback">
      <!-- eslint-disable vuejs-accessibility/no-autofocus -->
      <q-input
        ref="answerInput"
        v-model.number="userAnswer"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        outlined
        class="q-mb-md"
        autofocus
        input-class="text-h3 text-center"
        :rules="[val => val === null || Number.isInteger(val)]"
        data-cy="answer-input"
        @keyup.enter="submitAnswer"
      />
      <!-- eslint-enable vuejs-accessibility/no-autofocus -->

      <q-btn
        color="primary"
        size="lg"
        class="full-width q-mb-md"
        :disable="userAnswer === null || userAnswer === undefined || isButtonDisabled"
        icon="check"
        :label="TEXT_DE.shared.common.check"
        data-cy="submit-answer-button"
        @click="submitAnswer"
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
            <span class="text-positive text-weight-bold text-h4">{{ card.answer }}</span>
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
            ? `${TEXT_DE.shared.common.wait}`
            : TEXT_DE.shared.common.continue
        "
        data-cy="continue-button"
        :icon="answerData.isCorrect ? 'check_circle' : 'cancel'"
        @click="handleContinue"
      />
    </div>
  </div>
</template>

<style scoped>
.flashcard-container {
  width: 100%;
  max-width: 600px;
}
</style>
