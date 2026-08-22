<script setup lang="ts">
import type { CardLevel, FocusType, SessionMode } from '@flashcards/shared'
import { ALL_LEVELS, filterByLevels, TEXT_DE } from '@flashcards/shared'
import {
  HomeFocusSelector,
  HomeGameModeButtons,
  HomeLevelSelector,
  HomePageLayout
} from '@flashcards/shared/components'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ChickenMascot from '@/components/ChickenMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH, DEFAULT_RANGE } from '@/constants'
import { filterCardsByDivisor } from '@/services/cardSelector'
import {
  getVirtualCardsForRange,
  loadGameStats,
  loadRange,
  loadSettings,
  saveSettings
} from '@/services/storage'

const router = useRouter()

const { gameStats, gameSettings, startGame: storeStartGame } = useGameStore()

const select = ref<number[]>([...DEFAULT_RANGE])
const focus = ref<FocusType>('weak')
const range = ref<number[]>([...DEFAULT_RANGE])
const levels = ref<CardLevel[]>([...ALL_LEVELS])

// Divisor options based on current range (base 2-9, plus 11-12 when extended)
const selectOptions = computed<number[]>(() =>
  range.value.filter(n => (n >= 2 && n <= 9) || n === 11 || n === 12)
)

// Check if a divisor number is selected
const isNumberSelected = computed(() => (num: number) => select.value.includes(num))

// Compute filtered cards for the current selection
const basePool = computed(() => {
  const allAvailableCards = getVirtualCardsForRange(range.value)
  return filterCardsByDivisor(allAvailableCards, select.value)
})

// Cards matching the selected levels
const levelFilteredCards = computed(() => filterByLevels(basePool.value, levels.value))

onMounted(() => {
  // Load range configuration
  range.value = loadRange()

  // Load saved settings
  const savedSettings = loadSettings()
  if (savedSettings) {
    select.value = savedSettings.select
    focus.value = savedSettings.focus
    levels.value = savedSettings.levels
  } else {
    select.value = [...selectOptions.value]
  }

  // Restore select and focus from gameSettings in store if available (overrides saved)
  if (gameSettings.value) {
    select.value = gameSettings.value.select
    focus.value = gameSettings.value.focus
    levels.value = gameSettings.value.levels
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
    focus: focus.value,
    levels: [...levels.value]
  }
  saveSettings(gameConfig)
  storeStartGame(gameConfig, mode, true)
  void router.push({ name: '/GamePage' })
}

function goToHistory() {
  void router.push({ name: '/HistoryPage' })
}

function goToCards() {
  void router.push({ name: '/CardsManPage' })
}

function goToInfo() {
  void router.push({ name: '/InfoPage' })
}

function toggleSelect(option: number) {
  // Check if all options in current range are selected
  const allSelected = selectOptions.value.every(opt => select.value.includes(opt))

  if (allSelected && select.value.length > 1) {
    // All selected + tap D → select only D
    select.value = [option]
  } else if (select.value.includes(option) && select.value.length === 1) {
    // Only [D] selected + tap D → select all (DEFAULT_RANGE)
    select.value = [...selectOptions.value]
  } else if (select.value.includes(option)) {
    // D is selected (but not the only one and not all) → select all
    select.value = [...selectOptions.value]
  } else {
    // D not selected + tap D → add D to selection
    select.value = [...select.value, option].sort((a, b) => a - b)
  }
}
</script>

<template>
  <HomePageLayout
    :app-title="TEXT_DE.appTitle_div"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    :disable-start-button="levelFilteredCards.length === 0"
    @start-game="startGame"
    @go-to-cards="goToCards"
    @go-to-history="goToHistory"
    @go-to-info="goToInfo"
  >
    <template #mascot>
      <ChickenMascot
        smile
        style="width: 100px; height: 100px"
        data-cy="mascot"
      />
    </template>

    <template #config>
      <!-- Select Divisors -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.divide.selection }}
        </div>
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
            <div class="text-body1">
              {{ option }}
            </div>
          </q-btn>
        </div>
      </div>

      <!-- Level Selection -->
      <HomeLevelSelector
        v-model="levels"
        :cards="basePool"
        class="q-mb-sm"
      />

      <!-- Focus Selection -->
      <HomeFocusSelector v-model="focus" />
    </template>
    <template #extra-buttons>
      <HomeGameModeButtons
        :cards="levelFilteredCards"
        @start="startGameWithMode"
      />
    </template>
  </HomePageLayout>
</template>
