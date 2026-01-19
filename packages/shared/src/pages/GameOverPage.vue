<script setup lang="ts" generic="T extends BaseGameHistory">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  type BaseGameHistory,
  calculateDailyBonuses,
  type DailyBonusConfig,
  type GameResult,
  helperStatsDataWrite
} from '../index'
import { TEXT_DE } from '../text-de'

export interface StorageFunctions<T extends BaseGameHistory> {
  getGameResult: () => GameResult | null
  clearGameResult: () => void
  clearGameState: () => void
  incrementDailyGames: () => { isFirstGame: boolean; gamesPlayedToday: number }
  saveGameStats: (stats: { gamesPlayed: number; points: number; correctAnswers: number }) => void
  saveHistory: (history: T[]) => void
}

export interface Props<T extends BaseGameHistory> {
  storageFunctions: StorageFunctions<T>
  bonusConfig: DailyBonusConfig
  basePath: string
  gameStoreHistory: T[]
  gameStoreStats: { gamesPlayed: number; points: number; correctAnswers: number }
}

const props = defineProps<Props<T>>()

const router = useRouter()

const result = ref<GameResult | null>(null)
const bonusReasons = ref<Array<{ label: string; points: number }>>([])

const bonusPoints = computed(() => {
  return bonusReasons.value.reduce((sum, r) => sum + r.points, 0)
})

const totalPoints = computed(() => {
  if (!result.value) return 0
  return result.value.points + bonusPoints.value
})

const successRate = computed(() => {
  if (!result.value) return 0
  return result.value.correctAnswers / result.value.totalCards
})

const isMascotHappy = computed(() => {
  return successRate.value >= 0.7
})

const isMascotGrinning = computed(() => {
  return successRate.value === 1
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

function hasTotalCards(entry: BaseGameHistory): entry is BaseGameHistory & { totalCards: number } {
  return 'totalCards' in entry && typeof entry.totalCards === 'number'
}

onMounted(async () => {
  result.value = props.storageFunctions.getGameResult()

  if (!result.value && props.gameStoreHistory.length > 0) {
    const lastEntry = props.gameStoreHistory[props.gameStoreHistory.length - 1]
    if (hasTotalCards(lastEntry)) {
      result.value = {
        points: lastEntry.points,
        correctAnswers: lastEntry.correctAnswers,
        totalCards: lastEntry.totalCards
      }
    }
  }

  // No result found, redirect to home
  if (!result.value) {
    router.push({ name: '/' })
    return
  }

  // Calculate daily bonuses using shared helper
  const dailyInfo = props.storageFunctions.incrementDailyGames()
  const calculatedBonuses = calculateDailyBonuses(dailyInfo, props.bonusConfig)
  bonusReasons.value = calculatedBonuses

  // Add bonus points to in-memory state
  const totalBonusPoints = bonusReasons.value.reduce((sum, r) => sum + r.points, 0)

  // Update history in memory (last entry)
  if (props.gameStoreHistory.length > 0) {
    const lastEntry = props.gameStoreHistory[props.gameStoreHistory.length - 1]
    lastEntry.points += totalBonusPoints
  }

  // Update stats in memory - props are refs from store, so mutation is intentional
  // eslint-disable-next-line vue/no-mutating-props
  props.gameStoreStats.points += totalBonusPoints

  // Save final state to localStorage immediately (don't wait for user navigation)
  // This ensures data is persisted even if user closes tab or navigates away
  props.storageFunctions.saveHistory(props.gameStoreHistory)
  props.storageFunctions.saveGameStats(props.gameStoreStats)

  globalThis.addEventListener('keydown', handleKeyDown)
  // Update usage stats in DB
  await helperStatsDataWrite(props.basePath)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function goHome() {
  // Clear game result and game state from session storage
  // (final state already saved to localStorage in onMounted)
  props.storageFunctions.clearGameResult()
  props.storageFunctions.clearGameState()

  router.push({ name: '/' })
}
</script>

<template>
  <q-page
    v-if="result"
    class="flex flex-center q-pa-md"
    style="max-width: 600px; margin: 0 auto"
  >
    <div class="full-width text-center">
      <!-- Mascot -->
      <div class="flex flex-center q-mb-md">
        <slot
          name="mascot"
          :is-happy="isMascotHappy"
          :is-grinning="isMascotGrinning"
        />
      </div>

      <!-- Results Card -->
      <q-card class="q-mt-lg">
        <q-card-section class="q-pa-lg">
          <div class="row q-gutter-md justify-center">
            <div style="min-width: 90px">
              <div class="text-h4 text-primary text-weight-bold">
                <q-icon
                  name="emoji_events"
                  color="amber"
                  size="36px"
                />
                <span data-cy="final-points">{{ totalPoints }}</span>
              </div>
            </div>
            <div style="min-width: 90px">
              <span
                class="text-h4 text-positive text-weight-bold"
                data-cy="correct-answers-count"
              >
                {{ result.correctAnswers }}
              </span>

              <span
                class="text-h4 text-weight-bold"
                data-cy="total-questions-count"
              >
                / {{ result.totalCards }}
              </span>
            </div>
          </div>

          <!-- Bonus Points Section -->
          <div
            v-if="bonusReasons.length > 0"
            class="q-mt-md q-pa-sm bg-amber-1 rounded-borders"
          >
            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 text-amber-8 text-weight-bold q-mb-sm">
              <q-icon
                name="star"
                color="amber"
              />
              {{ TEXT_DE.shared.words.bonusPoints }}
            </div>
            <div
              v-for="(reason, index) in bonusReasons"
              :key="index"
              class="row justify-center q-mb-xs"
            >
              <q-chip
                color="amber-2"
                text-color="amber-9"
                dense
              >
                + {{ reason.points }}: {{ reason.label }}
              </q-chip>
            </div>
            <div class="row justify-center q-mt-sm">
              <div class="text-h6 text-weight-bold">
                {{ result.points }} + {{ bonusPoints }} =
                <span data-cy="total-points-with-bonus">{{ totalPoints }}</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Home Button -->
      <q-btn
        color="primary"
        size="lg"
        class="full-width q-mt-lg"
        icon="home"
        :label="TEXT_DE.shared.nav.backToHome"
        unelevated
        data-cy="back-to-home-button"
        @click="goHome"
      />
    </div>
  </q-page>
</template>
