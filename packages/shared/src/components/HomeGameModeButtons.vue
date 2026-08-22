<script setup lang="ts">
import { computed } from 'vue'

import { TEXT_DE } from '../text-de'
import type { BaseCard, SessionMode } from '../types'
import { filterBelowMaxLevel, filterLevel1Cards } from '../utils/gameModeUtils'

const props = defineProps<{
  cards: BaseCard[]
}>()

const emit = defineEmits<{
  start: [mode: SessionMode]
}>()

const hasLevel1Cards = computed(() => filterLevel1Cards(props.cards).length > 0)
const hasAnyCards = computed(() => props.cards.length > 0)
const hasBelowMaxLevelCards = computed(() => filterBelowMaxLevel(props.cards).length > 0)
</script>

<template>
  <div class="row q-gutter-sm q-mb-sm">
    <q-btn
      color="light-green"
      size="lg"
      class="col"
      icon="all_inclusive"
      :disable="!hasLevel1Cards"
      data-cy="start-endless-level1"
      @click="emit('start', 'endless-level1')"
    >
      &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.endlessLevel1 }}</span>
      <q-tooltip v-if="!hasLevel1Cards">
        {{ TEXT_DE.shared.gameModes.noLevel1Cards }}
      </q-tooltip>
    </q-btn>
    <q-btn
      color="light-green"
      size="lg"
      class="col"
      icon="looks_3"
      :disable="!hasAnyCards"
      data-cy="start-three-rounds"
      @click="emit('start', '3-rounds')"
    >
      &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.threeRounds }}</span>
    </q-btn>
    <q-btn
      color="light-green"
      size="lg"
      class="col"
      icon="military_tech"
      :disable="!hasBelowMaxLevelCards"
      data-cy="start-endless-level5"
      @click="emit('start', 'endless-level5')"
    >
      &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.endlessLevel5 }}</span>
      <q-tooltip v-if="!hasBelowMaxLevelCards">
        {{ TEXT_DE.shared.gameModes.noCardsBelow5 }}
      </q-tooltip>
    </q-btn>
  </div>
</template>
