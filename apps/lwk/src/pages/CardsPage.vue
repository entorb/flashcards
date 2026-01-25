<script setup lang="ts">
import {
  LEVEL_COLORS,
  TEXT_DE,
  useCardFiltering,
  useResetCards,
  MAX_LEVEL,
  MIN_LEVEL,
  MAX_TIME
} from '@flashcards/shared'
import {
  LevelDistribution,
  DeckSelector,
  CardManagementActions
} from '@flashcards/shared/components'
import { useQuasar } from 'quasar'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '@/composables/useGameStore'
import { loadLastSettings, saveLastSettings } from '@/services/storage'

const router = useRouter()
const $q = useQuasar()
const { showResetDialog } = useResetCards()
const store = useGameStore()
const { allCards, moveAllCards } = store
const { selectedLevel, handleLevelClick, filteredCards } = useCardFiltering(allCards)

const targetLevel = ref(1)

const cardsToShow = computed(() => {
  if (selectedLevel.value === null) {
    return allCards.value
  }
  return filteredCards.value
})

function handleGoBack() {
  router.push('/')
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
  router.push('/cards-edit')
}

function handleEditDecks() {
  router.push('/decks')
}

function handleMoveClick() {
  const level = Number(targetLevel.value)
  if (level < MIN_LEVEL || level > MAX_LEVEL) {
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
      .replace('{count}', allCards.value.length.toString())
      .replace('{level}', level.toString()),
    cancel: true
  }).onOk(() => {
    moveAllCards(level)
  })
}

function handleResetCards() {
  showResetDialog(() => {
    moveAllCards(1)
    allCards.value.forEach(card => (card.time = MAX_TIME))
  })
}

function handleResetCardsToDefaultSet() {
  showResetDialog(() => {
    store.resetCards()
  })
}

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] || LEVEL_COLORS[1]
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
        {{ TEXT_DE.voc.cards.editCardsTitle }}
      </div>
      <div style="width: 40px"></div>
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
        <span v-html="TEXT_DE.lwk.cards.header"></span>
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
            {{ TEXT_DE.voc.decks.title }}
          </div>
          <div class="row items-center q-gutter-md">
            <div class="col">
              <DeckSelector
                :get-decks="() => store.getDecks()"
                :switch-deck="name => store.switchDeck(name)"
                :load-last-settings="loadLastSettings"
                :save-last-settings="saveLastSettings"
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
            {{ TEXT_DE.voc.cards.editCardsTitle }}
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
      <LevelDistribution
        :cards="allCards"
        :selected-level="selectedLevel"
        @reset="handleResetCards"
        @level-click="handleLevelClick"
      />

      <!-- Current Deck Cards -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="collections_bookmark"
              class="q-mr-sm"
            />
            <span v-if="selectedLevel === null">
              {{ TEXT_DE.shared.words.cards }} ({{ allCards.length }})
            </span>
            <span v-else>
              {{ TEXT_DE.shared.words.level }} {{ selectedLevel }} ({{ cardsToShow.length }})
            </span>
          </div>
          <div style="overflow-y: auto; max-height: 400px">
            <q-list
              bordered
              separator
            >
              <q-item
                v-for="card in cardsToShow"
                :key="card.word"
              >
                <q-item-section>
                  <q-item-label class="text-h6">{{ card.word }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :label="`Level ${card.level}`"
                    :style="{ backgroundColor: getLevelColor(card.level) }"
                  />
                  <div class="text-caption text-grey-7 q-mt-xs">{{ card.time }}s</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <CardManagementActions
        app-prefix="lwk"
        :target-level="targetLevel"
        @update:target-level="targetLevel = $event"
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

.deck-selector-card {
  border-left: 4px solid var(--q-primary);
}
</style>
