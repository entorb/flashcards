<script setup lang="ts">
import {
  type AnswerStatus,
  MAX_TIME,
  TEXT_DE,
  isEndlessMode,
  useGameNavigation,
  useGameTimer,
  useKeyboardContinue
} from '@flashcards/shared'
import { shuffleArray } from '@flashcards/shared'
import {
  GameHeader,
  GameInputSubmit,
  GameNextCardButton,
  GamePointsBreakdown,
  GameShowCardQuestion
} from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '../composables/useGameStore'
import { validateTypingAnswer } from '../utils/helpers'

const router = useRouter()
const {
  allCards,
  gameCards,
  gameSettings,
  currentCardIndex,
  points,
  currentCard,
  lastPointsBreakdown,
  sessionMode,
  handleAnswer: storeHandleAnswer,
  nextCard,
  finishGame,
  discardGame
} = useGameStore()

// For endless mode, show remaining cards count (shrinks as cards are removed)
const totalCardsOverride = computed(() =>
  isEndlessMode(sessionMode.value) ? gameCards.value.length : undefined
)

// GamePage component state
const showAnswer = ref(false)
const answerStatus = ref<AnswerStatus | null>(null)
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

// Use shared timer logic
const { elapsedTime, stopTimer } = useGameTimer(currentCard)

// Use shared navigation logic
const { handleNextCard, handleGoHome } = useGameNavigation({
  stopTimer,
  nextCard,
  finishGame,
  discardGame,
  router
})

// Track button disabled state for keyboard control
const isProceedDisabled = ref(false)

// Determine feedback type based on answer status and game mode
function getFeedbackType(status: AnswerStatus | null): 'simple' | 'close' | 'typing-incorrect' {
  if (status === 'close') return 'close'
  if (status === 'incorrect' && gameSettings.value?.mode === 'typing') return 'typing-incorrect'
  return 'simple'
}

// Compute question and answer based on language direction
const question = computed(() => {
  if (!gameSettings.value || !currentCard.value) return ''
  return gameSettings.value.language === 'voc-de' ? currentCard.value.voc : currentCard.value.de
})

const correctAnswer = computed(() => {
  if (!gameSettings.value || !currentCard.value) return ''
  return gameSettings.value.language === 'voc-de' ? currentCard.value.de : currentCard.value.voc
})

const targetLang = computed(() => {
  return gameSettings.value?.language === 'voc-de' ? 'de' : 'voc'
})

// Determine which time to display based on mode
const displayTime = computed(() => {
  const settings = gameSettings.value
  const card = currentCard.value
  if (!settings || !card) return MAX_TIME

  if (settings.mode === 'multiple-choice') {
    return MAX_TIME // Don't show time for multiple-choice
  }
  return card.time
})

// Generate options for multiple choice
watch(
  () => [currentCard.value, gameSettings.value?.mode],
  () => {
    if (gameSettings.value?.mode === 'multiple-choice') {
      const otherAnswers = allCards.value
        .filter(c => c.voc !== currentCard.value?.voc)
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
  () => currentCard.value,
  () => {
    showAnswer.value = false
    answerStatus.value = null
    userAnswer.value = ''
    feedbackData.value = { type: 'simple' }
    showProceedButton.value = false
  },
  { immediate: true }
)

function submitAnswer(result: AnswerStatus) {
  if (answerStatus.value) return

  // Calculate answer time in seconds
  const answerTime = elapsedTime.value

  // Handle the answer in the store
  storeHandleAnswer(result, answerTime)

  answerStatus.value = result
  showAnswer.value = true

  // Always show proceed button for all answer types
  showProceedButton.value = true

  // Determine feedback type based on answer status
  const feedbackType = getFeedbackType(result)
  feedbackData.value.type = feedbackType

  if (result === 'close') {
    const mainCorrectAnswer = correctAnswer.value.split('/')[0]?.trim() ?? correctAnswer.value
    feedbackData.value = {
      type: feedbackType,
      userInput: userAnswer.value,
      correctText: mainCorrectAnswer
    }
  } else if (feedbackType === 'typing-incorrect') {
    feedbackData.value = {
      type: feedbackType,
      userInput: userAnswer.value,
      correctText: correctAnswer.value
    }
  }
}

function handleMultipleChoiceSubmit(option: string) {
  submitAnswer(option === correctAnswer.value ? 'correct' : 'incorrect')
}

function handleBlindSubmit(correct: boolean) {
  if (correct) {
    submitAnswer('correct')
  } else {
    submitAnswer('incorrect')
  }
}

function handleTypingSubmit() {
  if (answerStatus.value || !gameSettings.value) return

  const result = validateTypingAnswer(
    userAnswer.value,
    correctAnswer.value,
    gameSettings.value.language
  )
  submitAnswer(result)
}

// Use shared keyboard continue composable - check button disabled state
const canProceed = computed(() => showProceedButton.value && !isProceedDisabled.value)
useKeyboardContinue(canProceed, handleNextCard)

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
          :current-card="{ level: currentCard.level, time: displayTime, answer: correctAnswer }"
          :display-question="question"
          :show-correct-answer="showAnswer"
        />

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

          <GamePointsBreakdown
            :answer-status="answerStatus"
            :points-breakdown="lastPointsBreakdown"
          />

          <!-- Continue Button with icon when feedback is shown -->
          <GameNextCardButton
            v-if="answerStatus && showProceedButton"
            :answer-status="answerStatus"
            @click="handleNextCard"
            @disabled-change="isProceedDisabled = $event"
          />

          <!-- Multiple Choice -->
          <div
            v-else-if="gameSettings?.mode === 'multiple-choice'"
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
          <div v-else-if="gameSettings?.mode === 'blind'">
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
                    :label="TEXT_DE.shared.common.no"
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
                    :label="TEXT_DE.shared.common.yes"
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
          <div v-else-if="gameSettings?.mode === 'typing' && !answerStatus">
            <GameInputSubmit
              v-model="userAnswer"
              :button-disabled="false"
              :on-submit="handleTypingSubmit"
              input-type="text"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
