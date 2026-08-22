<script setup lang="ts">
import type { SessionMode } from '@flashcards/shared'
import { ALL_LEVELS, filterByLevels, TEXT_DE } from '@flashcards/shared'
import {
  HomeFocusSelector,
  HomeGameModeButtons,
  HomeLevelSelector,
  HomePageLayout
} from '@flashcards/shared/components'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import FoxMascot from '../components/FoxMascot.vue'
import { useGameStore } from '../composables/useGameStore'
import { BASE_PATH } from '../constants'
import { loadSettings, saveSettings } from '../services/storage'
import type { GameSettings } from '../types'

const router = useRouter()
const { gameStats, startGame: startGameStore, getDecks, switchDeck, allCards } = useGameStore()

const MODE_MULTIPLE_CHOICE = 'multiple-choice'

const settings = ref<GameSettings>({
  mode: MODE_MULTIPLE_CHOICE,
  focus: 'weak',
  language: 'voc-de',
  deck: 'en',
  levels: [...ALL_LEVELS]
})

const deckOptions = ref<{ label: string; value: string }[]>([])

// Cards matching the selected levels
const levelFilteredCards = computed(() => filterByLevels(allCards.value, settings.value.levels))

const hasLevel1Cards = computed<boolean>(() =>
  levelFilteredCards.value.some(card => card.level === 1)
)

const hasLevel1Or2Cards = computed<boolean>(() =>
  levelFilteredCards.value.some(card => card.level === 1 || card.level === 2)
)

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

onMounted(() => {
  // Load last settings if available
  const lastSettings = loadSettings()
  if (lastSettings) {
    settings.value = { ...settings.value, ...lastSettings }
  }

  // Refresh deck list and options
  const loadedDecks = getDecks()
  deckOptions.value = loadedDecks.map(deck => ({
    label: deck.name,
    value: deck.name
  }))
  // Ensure the selected mode is available for the current cards/levels
  ensureValidMode()
})

// Watch level-filtered pool to update mode availability whenever cards or levels change
watch(levelFilteredCards, () => {
  ensureValidMode()
})

function handleDeckChange(deckName: string) {
  settings.value.deck = deckName
  switchDeck(deckName)
  // ensureValidMode is called via the levelFilteredCards watcher
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

function startGameWithMode(mode: SessionMode) {
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
    :app-title="TEXT_DE.appTitle_voc"
    :base-path="BASE_PATH"
    :statistics="gameStats"
    :disable-start-button="levelFilteredCards.length === 0"
    @start-game="startGame"
    @go-to-cards="goToCards"
    @go-to-history="goToHistory"
    @go-to-info="goToInfo"
  >
    <template #mascot>
      <FoxMascot
        smile
        :size="100"
      />
    </template>

    <template #config>
      <!-- Deck Selection -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.voc.decks.title }}
        </div>
        <q-select
          v-model="settings.deck"
          outlined
          dense
          :options="deckOptions"
          emit-value
          map-options
          @update:model-value="handleDeckChange"
        />
      </div>

      <!-- Mode Selection -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.shared.words.mode }}
        </div>
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
            <q-tooltip v-if="option.tooltip">
              {{ option.tooltip }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Language Direction -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">
          {{ TEXT_DE.shared.words.direction }}
        </div>
        <q-btn-toggle
          v-model="settings.language"
          spread
          no-caps
          toggle-color="primary"
          :options="languageOptions"
        />
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
