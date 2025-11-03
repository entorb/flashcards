<script setup lang="ts" generic="T extends BaseGameHistory">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { TEXT_DE } from '../text-de'
import type { BaseGameHistory } from '../types'

export interface Props<T extends BaseGameHistory> {
  history: T[]
  formatDetails: (item: T) => string
  getPoints: (item: T) => number
  getCorrectAnswers: (item: T) => string
}

const props = defineProps<Props<T>>()

const router = useRouter()

const sortedHistory = computed(() => {
  return [...props.history].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Intl.DateTimeFormat('de-DE', options).format(date)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

onMounted(() => {
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page
    class="q-pa-md"
    style="max-width: 800px; margin: 0 auto"
  >
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        size="md"
        data-cy="back-button"
        @click="goHome"
      />
      <div
        class="text-h5 q-ml-sm text-weight-bold text-grey-8"
        data-cy="history-page-title"
      >
        {{ TEXT_DE.nav.history }}
      </div>
    </div>

    <!-- History List -->
    <q-list
      separator
      bordered
      class="rounded-borders"
    >
      <q-item
        v-for="(game, index) in sortedHistory"
        :key="index"
        v-ripple
        class="q-pa-md"
        clickable
        :data-cy="`history-game-${index}`"
      >
        <q-item-section avatar>
          <q-avatar
            color="primary"
            text-color="white"
            size="48px"
          >
            <q-icon name="emoji_events" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">
            {{ formatDate(game.date) }}
          </q-item-label>
          <q-item-label caption>
            {{ formatDetails(game) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="column items-end">
            <div
              class="text-h6 text-primary text-weight-bold"
              :data-cy="`history-game-${index}-points`"
            >
              {{ getPoints(game) }}
              <q-icon
                name="emoji_events"
                color="amber"
                size="24px"
              />
            </div>
            <div
              class="text-h6 text-primary text-weight-bold"
              :data-cy="`history-game-${index}-correct`"
            >
              <span>{{ getCorrectAnswers(game) }}</span>
              <q-icon
                name="check"
                size="24px"
              />
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
