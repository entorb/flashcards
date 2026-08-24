<script setup lang="ts">
import { useQuasar } from 'quasar'
import { LEVEL_COLORS, MAX_TIME } from '../constants'

interface Props {
  currentCard: {
    level: number
    time: number
    answer: string
  } | null
  displayQuestion: string
  showCorrectAnswer: boolean
}

defineProps<Props>()

const $q = useQuasar()
</script>

<template>
  <q-card class="q-mb-md">
    <q-card-section class="text-center q-pa-md">
      <div class="row justify-between items-center q-mb-sm">
        <q-badge
          v-if="currentCard"
          :label="`Level ${currentCard.level}`"
          text-color="grey-9"
          data-cy="card-level"
          :style="{ backgroundColor: LEVEL_COLORS[currentCard.level] }"
        />
        <q-badge
          v-if="currentCard && currentCard.time < MAX_TIME"
          text-color="grey-9"
          data-cy="card-time"
          :style="{ backgroundColor: LEVEL_COLORS[5 - Math.min(4, Math.floor(currentCard.time / (MAX_TIME / 5)))] }"
        >
          {{ currentCard.time.toFixed(1) }}s
        </q-badge>
      </div>
      <div
        class="q-my-md text-weight-bold"
        :class="$q.screen.gt.xs ? 'text-h2' : 'text-h3'"
        data-cy="question-display"
      >
        {{ displayQuestion }}

        <!-- Show correct answer after submission -->
        <template v-if="currentCard && showCorrectAnswer">
          =
          <output
            class="text-positive"
            :aria-label="`Correct answer: ${currentCard.answer}`"
          >
            {{ currentCard.answer }}
          </output>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>
