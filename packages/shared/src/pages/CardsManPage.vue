<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  CardManActions,
  CardsListOfCards,
  CardsManLevelDistribution,
  CardsTimeHistogram,
  HomeDeckSelector
} from '../components/index'
import { useCardFiltering } from '../composables/useCardFiltering'
import { useResetCards } from '../composables/useResetCards'
import { MAX_LEVEL, MAX_TIME, MIN_LEVEL } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'
import { getTimeFilterListTitle } from '../utils/helper'

interface Props {
  appPrefix: 'voc' | 'lwk'
  title: string
  bannerHtml: string
  decksTitle: string
  editCardsRoute: string
  editDecksRoute: string
  getDecks: () => { name: string; cards: BaseCard[] }[]
  switchDeck: (name: string) => void
  loadSettings: () => { deck?: string } | null
  // biome-ignore lint/suspicious/noExplicitAny: Shared component accepts different GameSettings types from voc/lwk apps
  saveSettings: (settings: any) => void
  store: {
    allCards: Ref<BaseCard[]>
    moveAllCards: (level: number) => void
    resetCards: () => void
  }
  getCardLabel: (card: BaseCard) => string
  getCardKey: (card: BaseCard) => string
}

const props = defineProps<Props>()

const router = useRouter()
const $q = useQuasar()
const { showResetDialog } = useResetCards()

const {
  selectedLevel,
  selectedTimeBucket,
  handleLevelClick,
  handleTimeBucketClick,
  filteredCards
} = useCardFiltering(() => props.store.allCards.value)

const targetLevel = ref(1)

const cardsToShow = computed(() => {
  if (selectedLevel.value === null && selectedTimeBucket.value === null) {
    return props.store.allCards.value
  }
  return filteredCards.value
})

const listTitle = computed(() => {
  if (selectedTimeBucket.value !== null) {
    return getTimeFilterListTitle(selectedTimeBucket.value)
  }
  return undefined
})

const duplicateKeys = computed(() => {
  const keyCount = new Map<string, number>()
  for (const card of props.store.allCards.value) {
    const key = props.getCardKey(card)
    keyCount.set(key, (keyCount.get(key) ?? 0) + 1)
  }
  const result = new Set<string>()
  for (const [key, count] of keyCount) {
    if (count > 1) result.add(key)
  }
  return result
})

function handleGoBack() {
  void router.push({ name: '/HomePage' })
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoBack()
  }
}

onMounted(() => {
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleEditCards() {
  void router.push(props.editCardsRoute)
}

function handleEditDecks() {
  void router.push(props.editDecksRoute)
}

function handleMoveClick() {
  const level = Number(targetLevel.value)
  if (Number.isNaN(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.shared.cardActions.invalidLevelError
        .replace('{min}', MIN_LEVEL.toString())
        .replace('{max}', MAX_LEVEL.toString())
    })
    return
  }

  $q.dialog({
    title: TEXT_DE.shared.cardActions.confirmMoveTitle,
    message: TEXT_DE.shared.cardActions.confirmMoveMessage
      .replace('{count}', props.store.allCards.value.length.toString())
      .replace('{level}', level.toString()),
    cancel: true
  }).onOk(() => {
    props.store.moveAllCards(level)
  })
}

function handleResetCards() {
  showResetDialog(() => {
    props.store.moveAllCards(1)
    for (const card of props.store.allCards.value) {
      card.time = MAX_TIME
    }
  })
}

function handleResetCardsToDefaultSet() {
  showResetDialog(() => {
    props.store.resetCards()
  })
}
</script>

<template>
  <q-page
    class="q-pa-md card-management-page"
    style="max-width: 700px; margin: 0 auto"
  >
    <!-- Header with back button -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="handleGoBack"
      >
        <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
      </q-btn>
      <div class="text-h6">
        {{ title }}
      </div>
      <div style="width: 40px" />
    </div>

    <!-- Info Banner -->
    <q-banner
      rounded
      class="bg-blue-1 q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="info"
          color="primary"
        />
      </template>
      <div class="text-body2">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="bannerHtml" />
      </div>
    </q-banner>

    <div class="q-gutter-md">
      <!-- Deck Selection -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="style"
              class="q-mr-sm"
            />
            {{ decksTitle }}
          </div>
          <div class="row items-center q-gutter-md">
            <div class="col">
              <HomeDeckSelector
                :get-decks="getDecks"
                :switch-deck="switchDeck"
                :load-settings="loadSettings"
                :save-settings="saveSettings"
              />
            </div>
            <q-btn
              outline
              color="primary"
              icon="edit"
              :label="TEXT_DE.shared.cards.edit"
              no-caps
              data-cy="edit-decks-button"
              @click="handleEditDecks"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Card Management -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="collections_bookmark"
              class="q-mr-sm"
            />
            {{ title }}
          </div>
          <q-btn
            outline
            color="primary"
            icon="edit"
            :label="TEXT_DE.shared.cards.edit"
            no-caps
            class="full-width"
            data-cy="edit-cards-button"
            @click="handleEditCards"
          />
        </q-card-section>
      </q-card>

      <!-- Level Distribution -->
      <CardsManLevelDistribution
        :cards="props.store.allCards.value"
        :selected-level="selectedLevel"
        @reset="handleResetCards"
        @level-click="handleLevelClick"
      />

      <!-- Time Histogram -->
      <CardsTimeHistogram
        :cards="props.store.allCards.value"
        :selected-bucket="selectedTimeBucket"
        @bucket-click="handleTimeBucketClick"
      />

      <!-- Current Deck Cards -->
      <CardsListOfCards
        :all-cards="props.store.allCards.value"
        :cards-to-show="cardsToShow"
        :selected-level="selectedLevel"
        :get-label="getCardLabel"
        :get-key="getCardKey"
        :duplicate-keys="duplicateKeys"
        :title="listTitle"
      />

      <CardManActions
        v-model="targetLevel"
        :app-prefix="appPrefix"
        @move-click="handleMoveClick"
        @reset-click="handleResetCardsToDefaultSet"
      />
    </div>
  </q-page>
</template>

<style scoped>
.card-management-page {
  min-height: 100vh;
  padding-bottom: 100px !important;
}

</style>
