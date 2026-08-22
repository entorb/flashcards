<script setup lang="ts">
import type { SessionMode } from '@flashcards/shared'
import { ALL_LEVELS, filterByLevels, TEXT_DE } from '@flashcards/shared'
import {
  HomeFocusSelector,
  HomeGameModeButtons,
  HomeLevelSelector,
  HomePageLayout
} from '@flashcards/shared/components'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import EisiMascot from '../components/EisiMascot.vue'
import { useGameStore } from '../composables/useGameStore'
import { BASE_PATH } from '../constants'
import { clearGameConfig, clearGameState, loadSettings, saveSettings } from '../services/storage'
import type { GameSettings } from '../types'

const router = useRouter()
const { gameStats, startGame: startGameStore, getDecks, switchDeck, allCards } = useGameStore()

const settings = ref<GameSettings>({
  mode: 'copy',
  focus: 'weak',
  deck: '', // Will be set in onMounted
  levels: [...ALL_LEVELS]
})

const deckOptions = ref<{ label: string; value: string }[]>([])

// Cards matching the selected levels
const levelFilteredCards = computed(() => filterByLevels(allCards.value, settings.value.levels))

const hasLevel1Or2Cards = computed<boolean>(() =>
  levelFilteredCards.value.some(card => card.level < 3)
)

const modeOptions = computed(() => [
  {
    label: TEXT_DE.lwk.mode.copy,
    value: 'copy' as const,
    icon: 'edit',
    disable: !hasLevel1Or2Cards.value,
    tooltip: hasLevel1Or2Cards.value ? undefined : TEXT_DE.lwk.mode.tooGoodForCopy
  },
  {
    label: TEXT_DE.lwk.mode.hidden,
    value: 'hidden' as const,
    icon: 'visibility_off'
  }
])

onMounted(() => {
  // Refresh deck list and options
  const loadedDecks = getDecks()
  deckOptions.value = loadedDecks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))

  // Load last settings if available and validate deck
  const lastSettings = loadSettings()
  if (lastSettings && loadedDecks.some(d => d.name === lastSettings.deck)) {
    settings.value = { ...settings.value, ...lastSettings }
  } else if (loadedDecks.length > 0) {
    // Default to first deck if no valid saved settings or deck is invalid
    settings.value.deck = loadedDecks[0]?.name ?? ''
    // Save settings to ensure deck info is persisted for card operations
    saveSettings(settings.value)
  }

  // Set active deck in store
  if (settings.value.deck) {
    switchDeck(settings.value.deck)
  }

  ensureValidMode()
})

function handleDeckChange(deckName: string) {
  settings.value.deck = deckName
  switchDeck(deckName)
  saveSettings(settings.value)
  ensureValidMode()
}

function ensureValidMode() {
  // Automatically switch to hidden if copy mode is disabled
  if (settings.value.mode === 'copy' && !hasLevel1Or2Cards.value) {
    settings.value.mode = 'hidden'
  }
}

function startGameWithMode(mode: SessionMode) {
  // Clear any previous game state before starting new game
  clearGameState()
  clearGameConfig()
  saveSettings(settings.value)
  startGameStore(settings.value, mode)
  void router.push({ name: '/GamePage' })
}

function startGame() {
  startGameWithMode('standard')
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
    :app-title="TEXT_DE.appTitle_lwk"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    :disable-start-button="levelFilteredCards.length === 0"
    @start-game="startGame"
    @go-to-cards="goToCards"
    @go-to-history="goToHistory"
    @go-to-info="goToInfo"
  >
    <template #mascot>
      <EisiMascot
        smile
        :size="100"
      />
    </template>

    <template #config>
      <!-- Deck Selection -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.lwk.decks.title }}
        </div>
        <q-select
          v-model="settings.deck"
          outlined
          dense
          :options="deckOptions"
          emit-value
          map-options
          data-cy="deck-select"
          @update:model-value="handleDeckChange"
        />
      </div>

      <!-- Mode Selection -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.shared.words.mode }}
        </div>
        <div
          class="row q-gutter-xs"
          data-cy="mode-selector"
        >
          <q-btn
            v-for="option in modeOptions"
            :key="option.value"
            :label="option.label"
            :icon="option.icon"
            :disable="option.disable"
            :outline="settings.mode !== option.value"
            :unelevated="settings.mode === option.value"
            :color="settings.mode === option.value ? 'primary' : 'grey-7'"
            no-caps
            class="col"
            :data-cy="`mode-option-${option.value}`"
            @click="!option.disable && (settings.mode = option.value)"
          >
            <q-tooltip v-if="option.tooltip">
              {{ option.tooltip }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Level Selection -->
      <HomeLevelSelector
        v-model="settings.levels"
        :cards="allCards"
        class="q-mb-sm"
      />

      <!-- Focus Selection -->
      <HomeFocusSelector v-model="settings.focus" />
    </template>
    <template #extra-buttons>
      <HomeGameModeButtons
        :cards="levelFilteredCards"
        @start="startGameWithMode"
      />
    </template>
  </HomePageLayout>
</template>
