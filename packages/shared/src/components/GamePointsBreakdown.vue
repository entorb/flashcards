<script setup lang="ts">
import { TEXT_DE } from '../text-de'
import type { AnswerStatus } from '../types'

interface Props {
  answerStatus: AnswerStatus | null
  pointsBreakdown: {
    levelPoints: number
    difficultyPoints: number
    pointsBeforeBonus: number
    closeAdjustment: number
    languageBonus: number
    timeBonus: number
    totalPoints: number
  } | null
}

defineProps<Props>()
</script>

<template>
  <!-- Points display on correct and close answers -->
  <q-card
    v-if="(answerStatus === 'correct' || answerStatus === 'close') && pointsBreakdown"
    class="q-mb-md"
    :class="[answerStatus === 'correct' ? 'bg-positive-1' : 'bg-warning-1']"
    data-cy="correct-answer-feedback"
  >
    <q-card-section class="text-center q-pa-md">
      <div
        class="text-h5 text-weight-bold"
        :class="[answerStatus === 'correct' ? 'text-positive' : 'text-warning']"
      >
        {{ pointsBreakdown.totalPoints }} {{ TEXT_DE.shared.words.points }}
      </div>
      <div class="text-caption q-mt-xs text-weight-medium text-grey-8">
        <div>
          +{{ pointsBreakdown.difficultyPoints }}
          {{ TEXT_DE.shared.scoring.breakdown.difficultyPoints }}
        </div>
        <div>
          +{{ pointsBreakdown.levelPoints }} {{ TEXT_DE.shared.scoring.breakdown.levelPoints }}
        </div>
        <div v-if="answerStatus === 'close'">
          -{{ pointsBreakdown.closeAdjustment }}
          {{ TEXT_DE.shared.scoring.breakdown.closeAdjustment }}
        </div>
        <div v-if="pointsBreakdown.languageBonus > 0">
          +{{ pointsBreakdown.languageBonus }}
          {{ TEXT_DE.shared.scoring.breakdown.languageBonus }}
        </div>
        <div v-if="pointsBreakdown.timeBonus > 0">
          +{{ pointsBreakdown.timeBonus }} {{ TEXT_DE.shared.scoring.breakdown.timeBonus }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
