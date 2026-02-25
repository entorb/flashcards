<script setup lang="ts">
import type { SessionMode } from '@flashcards/shared'
import { TEXT_DE, filterBelowMaxLevel, filterLevel1Cards } from '@flashcards/shared'
import { HomeFocusSelector, HomePageLayout } from '@flashcards/shared/components'
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
  deck: 'en'
})

const deckOptions = ref<{ label: string; value: string }[]>([])

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
  // Check if current deck has level 1 cards
  checkLevel1Cards()
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

const hasLevel1CardsForEndless = computed(() => filterLevel1Cards(allCards.value).length > 0)

const hasBelowMaxLevelCards = computed(() => filterBelowMaxLevel(allCards.value).length > 0)

function startGameWithMode(mode: SessionMode) {
  saveSettings(settings.value)
  startGameStore(settings.value, mode)
  router.push({ name: '/game' })
}

function startGame() {
  startGameWithMode('standard')
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
    :app-title="TEXT_DE.appTitle_voc"
    :base-path="BASE_PATH"
    :statistics="gameStats"
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
            <div class="text-subtitle2">{{ TEXT_DE.shared.words.mode }}</div>
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
            <div class="text-subtitle2">{{ TEXT_DE.shared.words.direction }}</div>
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
    <template #extra-buttons>
      <div class="row q-gutter-sm q-mb-sm">
        <q-btn
          color="positive"
          size="lg"
          class="col"
          icon="all_inclusive"
          :disable="!hasLevel1CardsForEndless"
          data-cy="start-endless-level1"
          @click="startGameWithMode('endless-level1')"
        >
          &nbsp; <span class="text-body1">{{ TEXT_DE.shared.gameModes.endlessLevel1 }}</span>
          <q-tooltip v-if="!hasLevel1CardsForEndless">
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
