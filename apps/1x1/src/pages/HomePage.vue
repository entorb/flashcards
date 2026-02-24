<script setup lang="ts">
import type { FocusType, SessionMode } from '@flashcards/shared'
import { TEXT_DE, filterLevel1Cards } from '@flashcards/shared'
import { HomeFocusSelector, HomePageLayout } from '@flashcards/shared/components'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH, DEFAULT_RANGE } from '@/constants'
import { filterCardsAll, filterCardsBySelection, filterCardsSquares } from '@/services/cardSelector'
import {
  getVirtualCardsForRange,
  loadGameStats,
  loadRange,
  loadSettings,
  saveSettings
} from '@/services/storage'
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

// Compute filtered cards for the current selection to check for Level 1 cards
const hasLevel1Cards = computed(() => {
  const currentRange = range.value
  const allAvailableCards = getVirtualCardsForRange(currentRange)
  const rangeSet = new Set(currentRange)

  let filteredCards
  if (select.value === 'x²') {
    filteredCards = filterCardsSquares(allAvailableCards, rangeSet)
  } else if (Array.isArray(select.value)) {
    filteredCards = filterCardsBySelection(allAvailableCards, select.value, rangeSet)
  } else {
    filteredCards = filterCardsAll(allAvailableCards, rangeSet)
  }

  return filterLevel1Cards(filteredCards).length > 0
})

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
  startGameWithMode('standard')
}

function startGameWithMode(mode: SessionMode) {
  const gameConfig = {
    select: select.value,
    focus: focus.value
  }
  saveSettings(gameConfig)
  storeStartGame(gameConfig, mode, true)
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
  <HomePageLayout
    :app-title="TEXT_DE.appTitle_1x1"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    @start-game="startGame"
    @go-to-cards="goToCards"
    @go-to-history="goToHistory"
    @go-to-info="goToInfo"
  >
    <template #mascot>
      <GroundhogMascot
        smile
        style="width: 100px; height: 100px"
        data-cy="mascot"
      />
    </template>

    <template #config>
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
    </template>
    <template #extra-buttons>
      <div class="row q-gutter-sm q-mb-sm">
        <q-btn
          color="positive"
          size="lg"
          class="col"
          icon="all_inclusive"
          :disable="!hasLevel1Cards"
          data-cy="start-endless-level1"
          @click="startGameWithMode('endless-level1')"
        >
          &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.endlessLevel1 }}</span>
          <q-tooltip v-if="!hasLevel1Cards">
            {{ TEXT_DE.shared.gameModes.noLevel1Cards }}
          </q-tooltip>
        </q-btn>
        <q-btn
          color="positive"
          size="lg"
          class="col"
          icon="looks_3"
          data-cy="start-three-rounds"
          @click="startGameWithMode('3-rounds')"
        >
          &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.threeRounds }}</span>
        </q-btn>
      </div>
    </template>
  </HomePageLayout>
</template>
