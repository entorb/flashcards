<script setup lang="ts">
import type { FocusType, SessionMode } from '@flashcards/shared'
import { filterBelowMaxLevel, filterLevel1Cards, TEXT_DE } from '@flashcards/shared'
import { HomeFocusSelector, HomePageLayout } from '@flashcards/shared/components'
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

// Divisor options based on current range (base 2-9, plus 11-12 when extended)
const selectOptions = computed<number[]>(() =>
  range.value.filter(n => (n >= 2 && n <= 9) || n === 11 || n === 12)
)

// Check if a divisor number is selected
const isNumberSelected = computed(() => (num: number) => select.value.includes(num))

// Compute filtered cards for the current selection
const selectedCards = computed(() => {
  const allAvailableCards = getVirtualCardsForRange(range.value)
  return filterCardsByDivisor(allAvailableCards, select.value)
})

const hasLevel1Cards = computed(() => filterLevel1Cards(selectedCards.value).length > 0)

const hasBelowMaxLevelCards = computed(() => filterBelowMaxLevel(selectedCards.value).length > 0)

onMounted(() => {
  // Load range configuration
  range.value = loadRange()

  // Load saved settings
  const savedSettings = loadSettings()
  if (savedSettings) {
    select.value = savedSettings.select
    focus.value = savedSettings.focus
  } else {
    select.value = [...selectOptions.value]
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
        <q-btn
          color="positive"
          size="lg"
          class="col"
          icon="military_tech"
          :disable="!hasBelowMaxLevelCards"
          data-cy="start-endless-level5"
          @click="startGameWithMode('endless-level5')"
        >
          &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.endlessLevel5 }}</span>
          <q-tooltip v-if="!hasBelowMaxLevelCards">
            {{ TEXT_DE.shared.gameModes.noCardsBelow5 }}
          </q-tooltip>
        </q-btn>
      </div>
    </template>
  </HomePageLayout>
</template>
