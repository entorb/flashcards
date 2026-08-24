<script setup lang="ts">
import { LEVEL_COLORS, MAX_TIME, TIME_BUCKET_BOUNDS } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'
import { getTimeBucketIndex, getTimeBucketLabel } from '../utils/helper'

interface Props {
  cards: BaseCard[]
  selectedBucket?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  bucketClick: [bucket: number]
}>()

const bucketIndices = Array.from(
  { length: TIME_BUCKET_BOUNDS.length + 1 },
  (_, i) => TIME_BUCKET_BOUNDS.length - i
)

function getCardCountByBucket(bucket: number): number {
  return props.cards.filter(
    card => card.time < MAX_TIME && getTimeBucketIndex(card.time) === bucket
  ).length
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon
          name="timer"
          class="q-mr-sm"
        />
        {{ TEXT_DE.shared.cards.cardsPerTime }}
      </div>

      <div class="row q-col-gutter-sm time-stats">
        <div
          v-for="bucket in bucketIndices"
          :key="bucket"
          class="col"
        >
          <q-card
            flat
            class="time-badge cursor-pointer"
            :data-cy="`time-bucket-${bucket}`"
            :style="{
              backgroundColor: LEVEL_COLORS[5 - bucket],
              border:
                props.selectedBucket === bucket
                  ? '3px solid var(--q-primary)'
                  : '3px solid transparent',
              transform: props.selectedBucket === bucket ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }"
            @click="emit('bucketClick', bucket)"
          >
            <q-card-section class="text-center q-pa-sm">
              <div class="text-caption text-grey-8">
                {{ getTimeBucketLabel(bucket) }}
              </div>
              <div class="text-h5 text-weight-bold text-grey-9">
                {{ getCardCountByBucket(bucket) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
