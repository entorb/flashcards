<script setup lang="ts">
import type { CardLevel, FocusType, SessionMode } from "@flashcards/shared"
import { ALL_LEVELS, filterByLevels, TEXT_DE } from "@flashcards/shared"
import {
  HomeFocusSelector,
  HomeGameModeButtons,
  HomeLevelSelector,
  HomePageLayout,
} from "@flashcards/shared/components"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

import ChickenMascot from "@/components/ChickenMascot.vue"
import { useGameStore } from "@/composables/useGameStore"
import { BASE_PATH, DEFAULT_RANGE } from "@/constants"
import { filterCardsByDivisor } from "@/services/cardSelector"
import { getVirtualCards, loadGameStats, loadSettings, saveSettings } from "@/services/storage"

const router = useRouter()

const { gameStats, gameSettings, startGame: storeStartGame } = useGameStore()

const select = ref<number[]>([...DEFAULT_RANGE])
const focus = ref<FocusType>("weak")
const levels = ref<CardLevel[]>([...ALL_LEVELS])

// Check if a divisor number is selected
const isNumberSelected = computed(() => (num: number) => select.value.includes(num))

// Compute filtered cards for the current selection
const basePool = computed(() => {
  const allAvailableCards = getVirtualCards()
  return filterCardsByDivisor(allAvailableCards, select.value)
})

// Cards matching the selected levels
const levelFilteredCards = computed(() => filterByLevels(basePool.value, levels.value))

onMounted(() => {
  // Load saved settings
  const savedSettings = loadSettings()
  if (savedSettings) {
    select.value = savedSettings.select
    focus.value = savedSettings.focus
    levels.value = savedSettings.levels
  } else {
    select.value = [...DEFAULT_RANGE]
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
  startGameWithMode("standard")
}

function startGameWithMode(mode: SessionMode) {
  const gameConfig = {
    select: select.value,
    focus: focus.value,
    levels: [...levels.value],
  }
  saveSettings(gameConfig)
  storeStartGame(gameConfig, mode, true)
  void router.push({ name: "/GamePage" })
}

function goToHistory() {
  void router.push({ name: "/HistoryPage" })
}

function goToCards() {
  void router.push({ name: "/CardsManPage" })
}

function goToInfo() {
  void router.push({ name: "/InfoPage" })
}

function toggleSelect(option: number) {
  // Check if all default divisors (2-9) are selected
  const allSelected = DEFAULT_RANGE.every((opt) => select.value.includes(opt))

  if (allSelected && select.value.length > 1) {
    // All selected + tap D → select only D
    select.value = [option]
  } else if (select.value.includes(option) && select.value.length === 1) {
    // Only [D] selected + tap D → select all (DEFAULT_RANGE)
    select.value = [...DEFAULT_RANGE]
  } else if (select.value.includes(option)) {
    // D is selected (but not the only one and not all) → select all
    select.value = [...DEFAULT_RANGE]
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
            v-for="option in DEFAULT_RANGE"
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
