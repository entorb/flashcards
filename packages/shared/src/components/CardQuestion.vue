<script setup lang="ts">
import { MAX_TIME } from '../constants'

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
</script>

<template>
  <q-card class="q-mb-md">
    <q-card-section class="text-center q-pa-md">
      <div class="row justify-between items-center q-mb-sm">
        <q-badge
          v-if="currentCard"
          color="primary"
          :label="`Level ${currentCard.level}`"
          data-cy="card-level"
        />
        <div
          v-if="currentCard && currentCard.time < MAX_TIME"
          class="text-caption text-weight-medium text-grey-7"
          data-cy="card-time"
        >
          {{ currentCard.time.toFixed(1) }}s
        </div>
      </div>
      <div
        class="q-my-md text-weight-bold"
        :class="$q.screen.gt.xs ? 'text-h2' : 'text-h3'"
        data-cy="question-display"
      >
        {{ displayQuestion }}

        <!-- Show correct answer after submission -->
        <template v-if="showCorrectAnswer">
          =
          <output
            class="text-positive"
            :aria-label="`Correct answer: ${currentCard?.answer}`"
          >
            {{ currentCard?.answer }}
          </output>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>
