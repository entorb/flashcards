<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { HomeFocusSelector, HomePageLayout } from '@flashcards/shared/components'
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
    settings.value.deck = loadedDecks[0]?.name ?? ''
    // Save settings to ensure deck info is persisted for card operations
    saveSettings(settings.value)
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
  <HomePageLayout
    :app-title="TEXT_DE.appTitle_lwk"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    :disable-start-button="allCards.length === 0"
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
            <HomeFocusSelector
              v-model="settings.focus"
              hide-label
            />
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </HomePageLayout>
</template>
