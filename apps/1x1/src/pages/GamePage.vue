<script setup lang="ts">
import { useGameNavigation, useGameTimer, useKeyboardContinue } from '@flashcards/shared'
import {
  GameFeedbackNegative,
  GameHeader,
  GameInputSubmit,
  GameNextCardButton,
  GamePointsBreakdown,
  GameShowCardQuestion
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
  sessionMode,
  handleAnswer,
  nextCard,
  finishGame: storeFinishGame,
  discardGame,
  lastPointsBreakdown
} = useGameStore()

// For endless mode, show remaining cards count (shrinks as cards are removed)
const totalCardsOverride = computed(() =>
  sessionMode.value === 'endless-level1' ? gameCards.value.length : undefined
)

// GamePage component state
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const answerStatus = ref<'correct' | 'incorrect' | null>(null)
const userAnswerNum = ref<number | null>(null)

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

// Track button disabled state for keyboard control
const isButtonDisabled = ref(false)

const displayQuestion = computed(() => {
  const card = currentCard.value
  if (!card) return ''
  return formatDisplayQuestion(card.question, gameSettings.value?.select)
})

// Calculate expected answer length for dynamic auto-submit
// (1 digit for 3×3=9, 2 digits for 6×8=48, 3 digits for 12×15=180)
const expectedAnswerLength = computed(() => {
  const card = currentCard.value
  if (!card) return 1
  return String(card.answer).length
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

// Use shared keyboard continue composable - check button disabled state
const canProceed = computed(() => showFeedback.value && !isButtonDisabled.value)
useKeyboardContinue(canProceed, handleContinue)

// Reset state when card changes
watch(
  () => currentCard.value,
  () => {
    userAnswer.value = null
    showFeedback.value = false
    answerStatus.value = null
    userAnswerNum.value = null
  },
  { immediate: true }
)

function submitAnswer() {
  if (userAnswer.value === null || userAnswer.value === undefined || !currentCard.value) return

  const parsedUserAnswer = Number.parseInt(String(userAnswer.value), 10)
  const isCorrect = parsedUserAnswer === currentCard.value.answer
  const answerTime = elapsedTime.value

  answerStatus.value = isCorrect ? 'correct' : 'incorrect'
  userAnswerNum.value = parsedUserAnswer

  showFeedback.value = true

  stopTimer()
  handleAnswer(answerStatus.value, answerTime)
}

function handleContinue() {
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
        v-bind="totalCardsOverride !== undefined ? { totalCardsOverride } : {}"
        :points="points"
        @back="handleGoHome"
      />

      <div v-if="currentCard">
        <GameShowCardQuestion
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
          <GameInputSubmit
            v-model="userAnswer"
            :button-disabled="false"
            :on-submit="submitAnswer"
            input-type="numeric"
          />
        </div>

        <!-- Feedback Button Section -->
        <div v-else-if="answerStatus && showFeedback">
          <!-- Show user answer vs correct answer comparison on wrong answers -->
          <GameFeedbackNegative
            v-if="answerStatus === 'incorrect'"
            status="incorrect"
            :user-answer="String(userAnswerNum)"
            :correct-answer="String(currentCard.answer)"
          />

          <GamePointsBreakdown
            :answer-status="answerStatus"
            :points-breakdown="lastPointsBreakdown"
          />

          <!-- Continue Button -->
          <GameNextCardButton
            :answer-status="answerStatus"
            @click="handleContinue"
            @disabled-change="isButtonDisabled = $event"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>
