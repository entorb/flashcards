<script setup lang="ts">
import { helperStatsDataRead, TEXT_DE } from '@flashcards/shared'
import {
  AppFooter,
  FocusSelector,
  PwaInstallInfo,
  StatisticsCard
} from '@flashcards/shared/components'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import FoxIcon from '../components/FoxMascot.vue'
import { useGameStore } from '../composables/useGameStore'
import { BASE_PATH } from '../constants'
import { loadLastSettings, saveLastSettings } from '../services/storage'
import type { GameSettings } from '../types'

const router = useRouter()
const { gameStats, startGame: startGameStore, getDecks, switchDeck, allCards } = useGameStore()

const MODE_MULTIPLE_CHOICE = 'multiple-choice'

const settings = ref<GameSettings>({
  mode: MODE_MULTIPLE_CHOICE,
  focus: 'weak',
  language: 'voc-de',
  deck: 'en'
})

const deckOptions = ref<{ label: string; value: string }[]>([])

const totalGamesPlayedByAll = ref<number>(0)

const hasLevel1Cards = ref<boolean>(true)
const hasLevel1Or2Cards = ref<boolean>(true)

const modeOptions = computed(() => [
  {
    label: TEXT_DE.voc.mode.multipleChoice,
    value: 'multiple-choice' as const,
    disable: !hasLevel1Cards.value,
    tooltip: hasLevel1Cards.value ? undefined : TEXT_DE.voc.mode.tooGoodForMultipleChoice
  },
  {
    label: TEXT_DE.voc.mode.blind,
    value: 'blind' as const,
    disable: !hasLevel1Or2Cards.value,
    tooltip: hasLevel1Or2Cards.value ? undefined : TEXT_DE.voc.mode.tooGoodForMultipleChoice
  },
  { label: TEXT_DE.voc.mode.typing, value: 'typing' as const }
])

const languageOptions = [
  { label: TEXT_DE.voc.direction.voc_de, value: 'voc-de' as const },
  { label: TEXT_DE.voc.direction.de_voc, value: 'de-voc' as const }
]

onMounted(async () => {
  const lastSettings = loadLastSettings()
  if (lastSettings) {
    // Merge loaded settings with defaults to ensure all properties exist
    settings.value = { ...settings.value, ...lastSettings }
  } else {
    // Save default settings to localStorage on first run
    saveLastSettings(settings.value)
  }
  // Refresh deck list and options
  const loadedDecks = getDecks()
  deckOptions.value = loadedDecks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))
  // Check if current deck has level 1 cards
  checkLevel1Cards()
  // Fetch total games played by all users from database
  totalGamesPlayedByAll.value = await helperStatsDataRead(BASE_PATH)
})

// Watch allCards to update hasLevel1Cards whenever cards change
watch(
  allCards,
  () => {
    checkLevel1Cards()
  },
  { deep: true }
)

function handleDeckChange(deckName: string) {
  settings.value.deck = deckName
  switchDeck(deckName)
  saveLastSettings(settings.value)
  checkLevel1Cards()
  // ensureValidMode is called within checkLevel1Cards
}

function checkLevel1Cards() {
  // Use allCards from store which reflects the current deck's cards
  hasLevel1Cards.value = allCards.value.some(card => card.level === 1)
  hasLevel1Or2Cards.value = allCards.value.some(card => card.level === 1 || card.level === 2)
  ensureValidMode()
}

function ensureValidMode() {
  // Automatically switch to next available mode if current mode is disabled
  if (settings.value.mode === MODE_MULTIPLE_CHOICE && !hasLevel1Cards.value) {
    // Multiple choice disabled, try blind
    settings.value.mode = hasLevel1Or2Cards.value ? 'blind' : 'typing'
  } else if (settings.value.mode === 'blind' && !hasLevel1Or2Cards.value) {
    // Blind disabled, switch to typing
    settings.value.mode = 'typing'
  }
}

function startGame() {
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
        {{ TEXT_DE.appTitle_voc }}
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
        <q-tooltip>{{ TEXT_DE.nav.infoTooltip }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Mascot and Statistics -->
    <div class="row items-center justify-center q-mb-md">
      <div class="col-12 col-sm-auto text-center">
        <!-- Mascot happiness based on total points -->
        <FoxIcon
          smile
          :size="100"
        />
      </div>
      <div
        class="col-12 col-sm"
        :class="$q.screen.gt.xs ? 'q-ml-md' : ''"
      >
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
              <div class="text-subtitle2">{{ TEXT_DE.voc.decks.title }}</div>
            </q-item-section>
            <q-item-section>
              <q-select
                v-model="settings.deck"
                outlined
                dense
                :options="deckOptions"
                emit-value
                map-options
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
              <div class="text-subtitle2">{{ TEXT_DE.words.mode }}</div>
            </q-item-section>
            <q-item-section>
              <div class="row q-gutter-xs">
                <q-btn
                  v-for="option in modeOptions"
                  :key="option.value"
                  :label="option.label"
                  :disable="option.disable"
                  :outline="settings.mode !== option.value"
                  :unelevated="settings.mode === option.value"
                  :color="settings.mode === option.value ? 'primary' : 'grey-7'"
                  no-caps
                  class="col"
                  @click="!option.disable && (settings.mode = option.value)"
                >
                  <q-tooltip v-if="option.tooltip">{{ option.tooltip }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>

          <!-- Language Direction -->
          <q-item class="q-px-none q-mb-sm">
            <q-item-section
              side
              style="min-width: 100px"
            >
              <div class="text-subtitle2">{{ TEXT_DE.words.direction }}</div>
            </q-item-section>
            <q-item-section>
              <q-btn-toggle
                v-model="settings.language"
                spread
                no-caps
                toggle-color="primary"
                :options="languageOptions"
              />
            </q-item-section>
          </q-item>

          <!-- Focus Selection -->
          <q-item class="q-px-none">
            <q-item-section
              side
              style="min-width: 100px"
            >
              <div class="text-subtitle2">{{ TEXT_DE.words.focus }}</div>
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

    <!-- Start Game Button -->
    <q-btn
      color="positive"
      size="lg"
      class="full-width q-mb-sm"
      icon="play_arrow"
      data-cy="start-button"
      @click="startGame"
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
        icon="layers"
        :label="TEXT_DE.nav.cards"
        data-cy="cards-button"
        @click="goToCards"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        icon="history"
        :label="TEXT_DE.nav.history"
        data-cy="history-button"
        @click="goToHistory"
      />
    </div>

    <PwaInstallInfo class="q-mt-md" />

    <AppFooter :base-path="BASE_PATH" />
  </q-page>
</template>
