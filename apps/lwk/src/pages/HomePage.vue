<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import {
  AppFooter,
  FocusSelector,
  PwaInstallInfo,
  StatisticsCard
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
  deck: '' // Will be set in onMounted
})

const deckOptions = ref<{ label: string; value: string }[]>([])

const hasLevel1Or2Cards = ref<boolean>(true)

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
    settings.value.deck = loadedDecks[0].name
  }

  // Set active deck in store
  if (settings.value.deck) {
    switchDeck(settings.value.deck)
  }

  checkLevel1Or2Cards()
  ensureValidMode()
})

function handleDeckChange(deckName: string) {
  settings.value.deck = deckName
  switchDeck(deckName)
  saveSettings(settings.value)
  checkLevel1Or2Cards()
  ensureValidMode()
}

function checkLevel1Or2Cards() {
  hasLevel1Or2Cards.value = allCards.value.some(card => card.level < 3)
}

function ensureValidMode() {
  // Automatically switch to hidden if copy mode is disabled
  if (settings.value.mode === 'copy' && !hasLevel1Or2Cards.value) {
    settings.value.mode = 'hidden'
  }
}

function startGame() {
  // Clear any previous game state before starting new game
  clearGameState()
  clearGameConfig()
  saveSettings(settings.value)
  startGameStore(settings.value)
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
</script>

<template>
  <q-page class="q-pa-md">
    <!-- Header with Info Button -->
    <div class="row items-center justify-between q-mb-md">
      <div
        class="text-h5"
        data-cy="app-title"
      >
        {{ TEXT_DE.appTitle_lwk }}
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
        <EisiMascot
          smile
          :size="100"
        />
      </div>
      <div class="col-12 col-sm">
        <StatisticsCard :statistics="gameStats" />
      </div>
    </div>

    <!-- Game Configuration -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pa-md">
        <q-list>
          <!-- Deck Selection -->
          <q-item class="q-px-none q-mb-sm">
            <q-item-section
              side
              style="min-width: 100px"
            >
              <div class="text-subtitle2">{{ TEXT_DE.lwk.decks.title }}</div>
            </q-item-section>
            <q-item-section>
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
            </q-item-section>
          </q-item>

          <!-- Mode Selection -->
          <q-item class="q-px-none q-mb-sm">
            <q-item-section
              side
              style="min-width: 100px"
            >
              <div class="text-subtitle2">{{ TEXT_DE.shared.words.mode }}</div>
            </q-item-section>
            <q-item-section>
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
                  <q-tooltip v-if="option.tooltip">{{ option.tooltip }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>

          <!-- Focus Selection -->
          <q-item class="q-px-none">
            <q-item-section
              side
              style="min-width: 100px"
            >
              <div class="text-subtitle2">{{ TEXT_DE.shared.words.focus }}</div>
            </q-item-section>
            <q-item-section>
              <FocusSelector
                v-model="settings.focus"
                hide-label
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Start Button -->
    <q-btn
      color="positive"
      size="lg"
      class="full-width q-mb-sm"
      icon="play_arrow"
      data-cy="start-button"
      :disable="allCards.length === 0"
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

    <PwaInstallInfo class="q-mt-md" />

    <AppFooter :base-path="BASE_PATH" />
  </q-page>
</template>
