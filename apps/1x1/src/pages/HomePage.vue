<script setup lang="ts">
import type { FocusType } from '@flashcards/shared'
import { TEXT_DE } from '@flashcards/shared'
import {
  AppFooter,
  HomeFocusSelector,
  HomePwaInstallInfo,
  HomeStatisticsCard
} from '@flashcards/shared/components'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH, DEFAULT_RANGE } from '@/constants'
import { loadGameStats, loadRange, loadSettings, saveSettings } from '@/services/storage'
import type { SelectionType } from '@/types'

const router = useRouter()

const { gameStats, gameSettings, startGame: storeStartGame } = useGameStore()

const select = ref<SelectionType>([...DEFAULT_RANGE])
const focus = ref<FocusType>('weak')
const range = ref<number[]>([...DEFAULT_RANGE])

// Compute available selection options based on current range
const selectOptions = computed<number[]>(() => range.value)

// Check if a number is selected
const isNumberSelected = computed(() => (num: number) => {
  if (typeof select.value === 'string') return false
  if (!Array.isArray(select.value)) return false
  return select.value.includes(num)
})

// Check if x² is selected
const isSquaresSelected = computed(() => select.value === 'x²')

onMounted(() => {
  // Load range configuration
  range.value = loadRange()

  // Load saved settings
  const savedSettings = loadSettings()
  if (savedSettings) {
    select.value = savedSettings.select
    focus.value = savedSettings.focus
  } else {
    // Set default select to all values in current range
    select.value = [...range.value]
  }

  // Restore select and focus from gameSettings in store if available (overrides saved)
  if (gameSettings.value) {
    select.value = gameSettings.value.select
    focus.value = gameSettings.value.focus
  }

  // Reload stats from storage in case they were updated during a game
  gameStats.value = loadGameStats()
})

function startGame() {
  // Save game config to store and navigate
  // Pass true as second parameter to force a fresh game start
  const gameConfig = {
    select: select.value,
    focus: focus.value
  }
  saveSettings(gameConfig)
  storeStartGame(gameConfig, true)

  // Navigate to game page without query parameters
  router.push({ name: '/game' })
}

function goToHistory() {
  router.push({ name: '/history' })
}

function goToCards() {
  router.push({ name: '/cards' })
}

function goToInfo() {
  router.push({ name: '/info' })
}

function toggleSelect(option: number) {
  // Handle undefined select (should not happen, but defensive)
  if (!Array.isArray(select.value) && typeof select.value !== 'string') {
    select.value = [option]
    return
  }

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
    <!-- Header with Info Button -->
    <div class="row items-center justify-between q-mb-md">
      <div
        class="text-h5"
        data-cy="app-title"
      >
        {{ TEXT_DE.appTitle_1x1 }}
      </div>
      <q-btn
        flat
        round
        dense
        icon="info_outline"
        color="grey-6"
        data-cy="info-button"
        @click="goToInfo"
      >
        <q-tooltip>{{ TEXT_DE.shared.nav.infoTooltip }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Mascot and Statistics -->
    <div class="row items-center justify-center q-mb-md">
      <div class="col-12 col-sm-auto text-center">
        <GroundhogMascot
          smile
          style="width: 100px; height: 100px"
          data-cy="mascot"
        />
      </div>
      <div
        class="col-12 col-sm"
        :class="$q.screen.gt.xs ? 'q-ml-md' : ''"
      >
        <HomeStatisticsCard
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
              :data-cy="`table-selection-button-${option}`"
              @click="toggleSelect(option)"
            >
              <div class="text-body1">{{ option }}</div>
            </q-btn>
            <q-btn
              :outline="!isSquaresSelected"
              :unelevated="isSquaresSelected"
              :color="isSquaresSelected ? 'secondary' : 'grey-5'"
              size="md"
              class="col squares-btn"
              data-cy="table-selection-button-squares"
              @click="toggleSquares"
            >
              <div class="text-body1">{{ TEXT_DE.multiply.selectionSquares }}</div>
            </q-btn>
          </div>
        </div>

        <!-- Focus Selection -->
        <HomeFocusSelector v-model="focus" />
      </q-card-section>
    </q-card>

    <!-- Start Button -->
    <q-btn
      color="positive"
      size="lg"
      class="full-width q-mb-sm"
      icon="play_arrow"
      data-cy="start-button"
      @click="startGame"
    >
      <span class="text-body1">{{ TEXT_DE.shared.common.start }}</span>
    </q-btn>

    <!-- Navigation Buttons -->
    <div class="row q-gutter-sm">
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        icon="layers"
        :label="TEXT_DE.shared.nav.cards"
        data-cy="cards-button"
        @click="goToCards"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        icon="history"
        :label="TEXT_DE.shared.nav.history"
        data-cy="history-button"
        @click="goToHistory"
      />
    </div>

    <HomePwaInstallInfo class="q-mt-md" />

    <AppFooter :base-path="BASE_PATH" />
  </q-page>
</template>
