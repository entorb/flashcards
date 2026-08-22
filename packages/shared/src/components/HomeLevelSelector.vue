<script setup lang="ts">
import { computed } from 'vue'

import { ALL_LEVELS } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard, CardLevel } from '../types'

interface Props {
  cards: BaseCard[]
}

const props = defineProps<Props>()

const levels = defineModel<CardLevel[]>({ required: true })

const levelCounts = computed<Map<number, number>>(() => {
  const counts = new Map<number, number>()
  for (const card of props.cards) {
    counts.set(card.level, (counts.get(card.level) ?? 0) + 1)
  }
  return counts
})

function isSelected(level: CardLevel): boolean {
  return levels.value.includes(level)
}

function labelFor(level: CardLevel): string {
  return `L${level} (${levelCounts.value.get(level) ?? 0})`
}

function toggle(level: CardLevel): void {
  // All selected + tap one → select only that one
  if (levels.value.length === ALL_LEVELS.length && isSelected(level)) {
    levels.value = [level]
    return
  }
  if (!isSelected(level)) {
    levels.value = [...levels.value, level].sort((a, b) => a - b)
    return
  }
  // Deselecting the last selected level selects all instead (never empty)
  levels.value = levels.value.length === 1 ? [...ALL_LEVELS] : levels.value.filter(l => l !== level)
}
</script>

<template>
  <div>
    <div class="text-subtitle2 q-mb-xs">
      {{ TEXT_DE.shared.words.level }}
    </div>
    <div
      class="row q-gutter-xs"
      data-cy="level-selector"
    >
      <q-btn
        v-for="level in ALL_LEVELS"
        :key="level"
        :outline="!isSelected(level)"
        :unelevated="isSelected(level)"
        :color="isSelected(level) ? 'primary' : 'grey-5'"
        size="md"
        class="col"
        :data-cy="`level-button-${level}`"
        @click="toggle(level)"
      >
        <div class="text-body1">
          {{ labelFor(level) }}
        </div>
      </q-btn>
    </div>
  </div>
</template>
