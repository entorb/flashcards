<script setup lang="ts">
import { LEVEL_COLORS, TEXT_DE, useCardFiltering, useResetCards } from '@flashcards/shared'
import { LevelDistribution } from '@flashcards/shared/components'
import { useQuasar } from 'quasar'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import DeckSelector from '../components/DeckSelector.vue'
import { useGameStore } from '../composables/useGameStore'
import { MAX_LEVEL, MIN_LEVEL } from '../constants'

const router = useRouter()
const $q = useQuasar()
const { showResetDialog } = useResetCards()
const { allCards, moveAllCards } = useGameStore()
const store = useGameStore()
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

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function handleEditCards() {
  router.push('/cards-edit')
}

function handleEditDecks() {
  router.push('/decks-edit')
}

onMounted(() => {
  globalThis.addEventListener('keydown', handleKeyDown)
  // DeckSelector's own onMounted already fetches fresh decks
})

function handleMoveClick() {
  const level = Number(targetLevel.value)
  if (level < MIN_LEVEL || level > MAX_LEVEL) {
    $q.notify({
      type: 'negative',
      message: TEXT_DE.voc.cards.invalidLevelError
        .replace('{min}', MIN_LEVEL.toString())
        .replace('{max}', MAX_LEVEL.toString())
    })
    return
  }

  $q.dialog({
    title: TEXT_DE.voc.cards.confirmMoveTitle,
    message: TEXT_DE.voc.cards.confirmMoveMessage
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
        <q-tooltip>{{ TEXT_DE.nav.backToHome }}</q-tooltip>
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
        <span v-html="TEXT_DE.voc.cards.header"></span>
      </div>
    </q-banner>

    <div class="q-gutter-md">
      <!-- Deck Selection - Prominent -->
      <q-card class="q-mb-md deck-selector-card">
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
              <DeckSelector />
            </div>
            <q-btn
              outline
              color="primary"
              icon="edit"
              :label="TEXT_DE.voc.decks.editDecksButton"
              no-caps
              data-cy="edit-decks-button"
              @click="handleEditDecks"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Card Management Actions -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="edit"
              class="q-mr-sm"
            />
            {{ TEXT_DE.voc.cards.editCardsTitle }}
          </div>
          <q-btn
            outline
            color="primary"
            icon="edit"
            :label="TEXT_DE.voc.cards.editCardsButton"
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
              {{ TEXT_DE.words.cards }} ({{ allCards.length }})
            </span>
            <span v-else>
              {{ TEXT_DE.words.level }} {{ selectedLevel }} ({{ cardsToShow.length }})
            </span>
          </div>
          <div style="overflow-y: auto; max-height: 400px">
            <q-list
              bordered
              separator
            >
              <q-item
                v-for="card in cardsToShow"
                :key="card.voc"
              >
                <q-item-section>
                  <q-item-label>{{ card.voc }} → {{ card.de }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :label="`Level ${card.level}`"
                    :style="{ backgroundColor: getLevelColor(card.level) }"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <!-- Advanced Actions -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-sm">
            <q-icon
              name="tune"
              class="q-mr-sm"
            />
            {{ TEXT_DE.voc.cards.moveAllTitle }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            Setze alle Karten im aktuellen Deck auf ein bestimmtes Level
          </div>
          <div class="row q-gutter-sm items-center">
            <q-input
              v-model.number="targetLevel"
              type="number"
              :min="MIN_LEVEL"
              :max="MAX_LEVEL"
              outlined
              dense
              label="Ziel-Level"
              style="width: 120px"
            />
            <q-btn
              outline
              color="primary"
              icon="arrow_forward"
              :label="TEXT_DE.voc.cards.moveAll"
              no-caps
              @click="handleMoveClick"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Danger Zone -->
      <q-card class="bg-red-1">
        <q-card-section>
          <div class="text-h6 q-mb-sm text-negative">
            <q-icon
              name="warning"
              class="q-mr-sm"
            />
            {{ TEXT_DE.voc.cards.dangerZoneTitle }}
          </div>
          <div class="text-caption text-grey-8 q-mb-md">
            Diese Aktion löscht alle Karten und setzt den Lernfortschritt zurück
          </div>
          <q-btn
            outline
            color="negative"
            icon="delete_forever"
            :label="TEXT_DE.voc.cards.reset"
            no-caps
            @click="handleResetCardsToDefaultSet"
          />
        </q-card-section>
      </q-card>
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
