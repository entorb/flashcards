<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/composables/useGameStore'
import type { SelectionType } from '@/types'
import type { FocusType } from '@flashcards/shared'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { DEFAULT_SELECT, BASE_PATH } from '@/constants'
import { TEXT_DE } from '@flashcards/shared'
import {
  AppFooter,
  StatisticsCard,
  PwaInstallInfo,
  FocusSelector
} from '@flashcards/shared/components'
import { loadGameStats, loadRange } from '@/services/storage'

const router = useRouter()

const { gameStats, gameSettings, startGame: storeStartGame } = useGameStore()

const select = ref<SelectionType>(DEFAULT_SELECT)
const focus = ref<FocusType>('weak')
const range = ref<number[]>([3, 4, 5, 6, 7, 8, 9])

// Compute available selection options based on current range
const selectOptions = computed<number[]>(() => range.value)

// Check if a number is selected
const isNumberSelected = computed(() => (num: number) => {
  if (typeof select.value === 'string') return false
  return select.value.includes(num)
})

// Check if x² is selected
const isSquaresSelected = computed(() => select.value === 'x²')

onMounted(() => {
  // Load range configuration
  range.value = loadRange()

  // Set default select to all values in current range
  select.value = [...range.value]

  // Restore select and focus from gameSettings in store
  if (gameSettings.value) {
    select.value = gameSettings.value.select
    focus.value = gameSettings.value.focus
  }

  // Reload stats from storage in case they were updated during a game
  gameStats.value = loadGameStats()
})

// Watch for changes and save to gameSettings in store
watch(
  [select, focus],
  () => {
    if (gameSettings.value) {
      gameSettings.value.select = select.value
      gameSettings.value.focus = focus.value
    }
  },
  { deep: true }
)

function startGame() {
  // Save game config to store and navigate
  storeStartGame({
    select: select.value,
    focus: focus.value
  })

  // Navigate to game page without query parameters
  router.push({ name: '/game' })
}

function goToHistory() {
  router.push({ name: '/history' })
}

function goToCards() {
  router.push({ name: '/cards' })
}

function toggleSelect(option: number) {
  // Convert string selections to array first
  if (typeof select.value === 'string') {
    select.value = [option]
    return
  }

  // Check if all options in current range are selected
  const allSelected =
    Array.isArray(select.value) &&
    selectOptions.value.every(opt => (select.value as number[]).includes(opt))

  if (allSelected && Array.isArray(select.value) && select.value.length > 1) {
    // If all are selected and clicking one number, select only that number
    select.value = [option]
  } else if (Array.isArray(select.value) && select.value.includes(option)) {
    // If already selected, select all in current range
    select.value = [...selectOptions.value]
  } else if (Array.isArray(select.value)) {
    // Not selected, add it and sort
    select.value = [...select.value, option].sort((a, b) => a - b)
  }
}

function toggleSquares() {
  if (select.value === 'x²') {
    // If x² is already selected, deselect and go to all in range
    select.value = [...selectOptions.value]
  } else {
    // Select x² mode
    select.value = 'x²'
  }
}
</script>

<template>
  <q-page class="q-pa-md">
    <div
      class="text-h5 q-mb-md"
      data-cy="app-title"
    >
      {{ TEXT_DE.appTitle_1x1 }}
    </div>

    <!-- Mascot and Statistics -->
    <div class="row items-center justify-center q-mb-md">
      <div class="col-12 col-sm-auto text-center">
        <GroundhogMascot
          style="width: 100px; height: 100px"
          data-cy="mascot"
        />
      </div>
      <div
        class="col-12 col-sm"
        :class="$q.screen.gt.xs ? 'q-ml-md' : ''"
      >
        <StatisticsCard
          :statistics="gameStats"
          data-cy="statistics-card"
        />
      </div>
    </div>

    <!-- Game Configuration -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pa-md">
        <!-- Select Rows -->
        <div class="q-mb-sm">
          <div class="text-subtitle2 q-mb-xs">{{ TEXT_DE.multiply.selection }}</div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="option in selectOptions"
              :key="option"
              :outline="!isNumberSelected(option)"
              :unelevated="isNumberSelected(option)"
              :color="isNumberSelected(option) ? 'primary' : 'grey-5'"
              size="md"
              class="col"
              @click="toggleSelect(option)"
              :data-cy="`table-selection-button-${option}`"
            >
              <div class="text-body1">{{ option }}</div>
            </q-btn>
            <q-btn
              :outline="!isSquaresSelected"
              :unelevated="isSquaresSelected"
              :color="isSquaresSelected ? 'secondary' : 'grey-5'"
              size="md"
              class="col squares-btn"
              @click="toggleSquares"
              data-cy="table-selection-button-squares"
            >
              <div class="text-body1">{{ TEXT_DE.multiply.selectionSquares }}</div>
            </q-btn>
          </div>
        </div>

        <!-- Focus Selection -->
        <FocusSelector v-model="focus" />
      </q-card-section>
    </q-card>

    <!-- Start Game Button -->
    <q-btn
      color="positive"
      size="lg"
      class="full-width q-mb-sm"
      @click="startGame"
      icon="play_arrow"
      data-cy="start-button"
    >
      <span class="text-body1">{{ TEXT_DE.common.start }}</span>
    </q-btn>

    <!-- Navigation Buttons -->
    <div class="row q-gutter-sm">
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        @click="goToCards"
        icon="layers"
        :label="TEXT_DE.nav.cards"
        data-cy="cards-button"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        @click="goToHistory"
        icon="history"
        :label="TEXT_DE.nav.history"
        data-cy="history-button"
      />
    </div>

    <PwaInstallInfo class="q-mt-md" />

    <AppFooter :base-path="BASE_PATH" />
  </q-page>
</template>
