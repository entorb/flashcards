<script setup lang="ts">
import type { CardLevel, FocusType, SessionMode } from '@flashcards/shared'
import {
  ALL_LEVELS,
  filterBelowMaxLevel,
  filterByLevels,
  filterLevel1Cards,
  TEXT_DE
} from '@flashcards/shared'
import { HomeFocusSelector, HomeLevelSelector, HomePageLayout } from '@flashcards/shared/components'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import PumToggleButtons from '@/components/PumToggleButtons.vue'
import RaccoonMascot from '@/components/RaccoonMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH, DEFAULT_DIFFICULTIES, DEFAULT_OPERATIONS } from '@/constants'
import { filterCards } from '@/services/cardSelector'
import {
  initializeCards,
  loadCards,
  loadGameStats,
  loadSettings,
  saveSettings
} from '@/services/storage'
import type { Difficulty, Operation } from '@/types'

const router = useRouter()

// App title from TEXT_DE
const appTitle = TEXT_DE.appTitle_pum

const { gameStats, gameSettings, startGame: storeStartGame } = useGameStore()

const operations = ref<Operation[]>([...DEFAULT_OPERATIONS])
const difficulties = ref<Difficulty[]>([...DEFAULT_DIFFICULTIES])
const focus = ref<FocusType>('weak')
const levels = ref<CardLevel[]>([...ALL_LEVELS])

const operationButtons = [
  {
    value: 'plus',
    label: TEXT_DE.plusMinus.selection.plus,
    dataCy: 'operation-button-plus'
  },
  {
    value: 'minus',
    label: TEXT_DE.plusMinus.selection.minus,
    dataCy: 'operation-button-minus'
  }
]

const difficultyButtons = [
  {
    value: 'simple',
    label: TEXT_DE.plusMinus.selection.simple,
    dataCy: 'difficulty-button-simple'
  },
  {
    value: 'medium',
    label: TEXT_DE.plusMinus.selection.medium,
    dataCy: 'difficulty-button-medium'
  },
  {
    value: 'advanced',
    label: TEXT_DE.plusMinus.selection.advanced,
    dataCy: 'difficulty-button-advanced'
  }
]

// Compute filtered cards for the current selection (operations + difficulties)
const basePool = computed(() => {
  // Fresh installs have no persisted cards yet — seed them so the start button enables
  const stored = loadCards()
  const allCards = stored.length > 0 ? stored : initializeCards()
  return filterCards(allCards, {
    operations: operations.value,
    difficulties: difficulties.value,
    focus: focus.value,
    levels: levels.value
  })
})

// Cards matching the selected levels
const levelFilteredCards = computed(() => filterByLevels(basePool.value, levels.value))

const hasLevel1Cards = computed(() => filterLevel1Cards(levelFilteredCards.value).length > 0)

const hasBelowMaxLevelCards = computed(
  () => filterBelowMaxLevel(levelFilteredCards.value).length > 0
)

onMounted(() => {
  // Load saved settings
  const savedSettings = loadSettings()
  if (savedSettings) {
    operations.value = savedSettings.operations
    difficulties.value = savedSettings.difficulties
    focus.value = savedSettings.focus
    levels.value = savedSettings.levels
  }

  // Restore from gameSettings in store if available (overrides saved)
  if (gameSettings.value) {
    operations.value = gameSettings.value.operations
    difficulties.value = gameSettings.value.difficulties
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
    operations: operations.value,
    difficulties: difficulties.value,
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
</script>

<template>
  <HomePageLayout
    :app-title="appTitle"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    :disable-start-button="levelFilteredCards.length === 0"
    @start-game="startGame"
    @go-to-cards="goToCards"
    @go-to-history="goToHistory"
    @go-to-info="goToInfo"
  >
    <template #mascot>
      <RaccoonMascot
        smile
        style="width: 100px; height: 100px"
        data-cy="mascot"
      />
    </template>

    <template #config>
      <PumToggleButtons
        :title="TEXT_DE.plusMinus.selection.operations"
        :buttons="operationButtons"
        :model-value="operations"
        @update:model-value="operations = $event as Operation[]"
      />

      <PumToggleButtons
        :title="TEXT_DE.plusMinus.selection.difficulties"
        :buttons="difficultyButtons"
        :model-value="difficulties"
        @update:model-value="difficulties = $event as Difficulty[]"
      />

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
          :disable="levelFilteredCards.length === 0"
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
