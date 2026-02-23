<script setup lang="ts">
interface Statistics {
  gamesPlayed: number
  points: number
  correctAnswers: number
}

interface Props {
  statistics: Statistics
}

defineProps<Props>()
</script>

<template>
  <q-card
    flat
    bordered
    class="rounded-borders"
  >
    <q-card-section class="q-pa-sm">
      <div class="row text-center q-gutter-sm justify-around">
        <div class="col-3">
          <div
            class="text-h6"
            data-cy="stats-games-played"
          >
            {{ statistics.gamesPlayed }} x
          </div>
        </div>
        <div class="col-3">
          <div
            class="text-h6"
            data-cy="stats-total-points"
          >
            {{ statistics.points }}
            <q-icon
              name="emoji_events"
              color="amber"
              size="24px"
            />
          </div>
        </div>
        <div class="col-4">
          <div
            class="text-h6"
            data-cy="stats-correct-answers"
          >
            {{ statistics.correctAnswers }}
            <q-icon
              name="check"
              size="16px"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
