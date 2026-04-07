<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import GameFeedbackNegative from '../components/GameFeedbackNegative.vue'
import GameHeader from '../components/GameHeader.vue'
import GameInputSubmit from '../components/GameInputSubmit.vue'
import GameNextCardButton from '../components/GameNextCardButton.vue'
import GamePointsBreakdown from '../components/GamePointsBreakdown.vue'
import GameShowCardQuestion from '../components/GameShowCardQuestion.vue'
import { useGameNavigation } from '../composables/useGameNavigation'
import { useGameTimer } from '../composables/useGameTimer'
import { useKeyboardContinue } from '../composables/useKeyboardContinue'
import type { PointsBreakdown } from '../services/scoring'
import type { AnswerStatus, BaseCard, SessionMode } from '../types'
import { isEndlessMode } from '../utils/gameModeUtils'

export interface NumericGameCard extends BaseCard {
  question: string
  answer: number
}

export interface NumericGameStore<TCard extends NumericGameCard, TSettings> {
  gameCards: Ref<TCard[]>
  currentCardIndex: Ref<number>
  points: Ref<number>
  currentCard: Ref<TCard | null>
  gameSettings: Ref<TSettings | null>
  sessionMode: Ref<SessionMode>
  lastPointsBreakdown: Ref<PointsBreakdown | null>
  handleAnswer: (result: AnswerStatus, answerTime: number) => void
  nextCard: () => boolean
  finishGame: () => void
  discardGame: () => void
}

const props = defineProps<{
  store: NumericGameStore<NumericGameCard, unknown>
  formatQuestion: (question: string) => string
}>()

const router = useRouter()

// For endless mode, show remaining cards count (shrinks as cards are removed)
const totalCardsOverride = computed(() =>
  isEndlessMode(props.store.sessionMode.value) ? props.store.gameCards.value.length : undefined
)

// GamePage component state
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const answerStatus = ref<'correct' | 'incorrect' | null>(null)
const userAnswerNum = ref<number | null>(null)

// Use shared timer logic
const currentCard = computed(() => props.store.currentCard.value)
const { elapsedTime, stopTimer } = useGameTimer(currentCard)

// Use shared navigation logic
const { handleNextCard, handleGoHome } = useGameNavigation({
  stopTimer,
  nextCard: (...args) => props.store.nextCard(...args),
  finishGame: (...args) => props.store.finishGame(...args),
  discardGame: (...args) => props.store.discardGame(...args),
  router
})

// Track button disabled state for keyboard control
const isButtonDisabled = ref(false)

const displayQuestion = computed(() => {
  if (!currentCard.value) return ''
  return props.formatQuestion(currentCard.value.question)
})

// Calculate expected answer length for dynamic auto-submit
const expectedAnswerLength = computed(() => {
  if (!currentCard.value) return 1
  return String(currentCard.value.answer).length
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
  currentCard,
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
  props.store.handleAnswer(answerStatus.value, answerTime)
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
  if (props.store.gameCards.value.length === 0 && !props.store.gameSettings.value) {
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
        :current-index="props.store.currentCardIndex.value"
        :total-cards="props.store.gameCards.value.length"
        v-bind="totalCardsOverride !== undefined ? { totalCardsOverride } : {}"
        :points="props.store.points.value"
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
            :correct-answer="String(currentCard?.answer)"
          />

          <GamePointsBreakdown
            :answer-status="answerStatus"
            :points-breakdown="props.store.lastPointsBreakdown.value"
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
