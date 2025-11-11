<script setup lang="ts">
import { LEVEL_COLORS } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'

interface Props {
  cards: BaseCard[]
  selectedLevel?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  reset: []
  levelClick: [level: number]
}>()

function getCardCountByLevel(level: number): number {
  return props.cards.filter(card => card.level === level).length
}

function getLevelBackgroundColor(level: number): string {
  return LEVEL_COLORS[level] || '#f5f5f5'
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="row items-center justify-between q-mb-none">
        <div class="text-subtitle1 text-weight-bold q-ma-none">
          {{ TEXT_DE.cards.cardsPerLevel }}
        </div>
        <q-btn
          flat
          dense
          color="negative"
          icon="refresh"
          :label="TEXT_DE.common.reset"
          size="sm"
          data-cy="reset-levels-button"
          @click="handleReset"
        />
      </div>

      <div class="row q-col-gutter-sm level-stats">
        <div
          v-for="level in [1, 2, 3, 4, 5]"
          :key="level"
          class="col"
        >
          <q-card
            flat
            class="level-badge cursor-pointer"
            :style="{
              backgroundColor: getLevelBackgroundColor(level),
              border:
                props.selectedLevel === level
                  ? '3px solid var(--q-primary)'
                  : '3px solid transparent',
              transform: props.selectedLevel === level ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }"
            @click="emit('levelClick', level)"
          >
            <q-card-section class="text-center q-pa-sm">
              <div class="text-caption text-grey-8">{{ TEXT_DE.words.level }} {{ level }}</div>
              <div class="text-h5 text-weight-bold text-grey-9">
                {{ getCardCountByLevel(level) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
