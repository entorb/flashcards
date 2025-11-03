<script setup lang="ts">
import { TEXT_DE, useCardFiltering, useResetCards } from '@flashcards/shared'
import { LevelDistribution } from '@flashcards/shared/components'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  BG_COLORS,
  LEVEL_COLORS,
  MAX_CARD_TIME,
  MIN_CARD_TIME,
  TIME_COLOR_THRESHOLDS,
  TIME_COLORS
} from '@/constants'
import {
  createDefaultCard,
  loadCards,
  loadRange,
  resetCards,
  saveRange,
  toggleFeature
} from '@/services/storage'
import type { Card } from '@/types'

const router = useRouter()
const { showResetDialog } = useResetCards()
const cards = ref<Card[]>([])
const range = ref<number[]>([3, 4, 5, 6, 7, 8, 9])

// Get virtual cards for current range (includes non-existent cards with defaults)
const cardsInRange = computed(() => {
  const cardMap = new Map(cards.value.map(c => [c.question, c]))
  const virtualCards: Card[] = []

  for (const y of range.value) {
    for (const x of range.value) {
      if (x <= y) {
        const question = `${y}x${x}`
        const existingCard = cardMap.get(question)

        if (existingCard) {
          virtualCards.push(existingCard)
        } else {
          virtualCards.push(createDefaultCard(y, x))
        }
      }
    }
  }

  return virtualCards
})

const { selectedLevel, handleLevelClick, filteredCards } = useCardFiltering(cardsInRange)

const sortedFilteredCards = computed(() => {
  const cards = [...filteredCards.value]
  cards.sort((a, b) => {
    // Parse question format "5x3" to get y=5, x=3
    const [aY, aX] = a.question.split('x').map(Number)
    const [bY, bX] = b.question.split('x').map(Number)

    // Sort by X first (column), then by Y (row)
    if (aX !== bX) return aX - bX
    return aY - bY
  })
  return cards
})

const minTime = computed(() => {
  if (cardsInRange.value.length === 0) return MIN_CARD_TIME
  return Math.max(MIN_CARD_TIME, Math.min(...cardsInRange.value.map(c => c.time)))
})
const maxTime = computed(() => {
  if (cardsInRange.value.length === 0) return MAX_CARD_TIME
  return Math.min(MAX_CARD_TIME, Math.max(...cardsInRange.value.map(c => c.time)))
})

// Get Y values to display based on current range
const yValues = computed(() => range.value)

// Get X values to display based on current range
const xValues = computed(() => range.value)

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

onMounted(() => {
  cards.value = loadCards()
  range.value = loadRange()
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})

function getCard(y: number, x: number): Card {
  const card = cardsInRange.value.find(card => card.question === `${y}x${x}`)
  if (card) return card

  // Fallback to default card (should not be needed as cardsInRange includes all)
  return createDefaultCard(y, x)
}

function getTimeTextColor(time: number): string {
  if (cardsInRange.value.length === 0) return '#666666'

  const min = minTime.value
  const max = maxTime.value
  const range = max - min

  if (range === 0) return TIME_COLORS.veryFast

  const normalized = (time - min) / range

  // Green (fast) to Red (slow) using thresholds
  if (normalized < TIME_COLOR_THRESHOLDS.veryFast) return TIME_COLORS.veryFast
  if (normalized < TIME_COLOR_THRESHOLDS.fast) return TIME_COLORS.fast
  if (normalized < TIME_COLOR_THRESHOLDS.medium) return TIME_COLORS.medium
  if (normalized < TIME_COLOR_THRESHOLDS.slow) return TIME_COLORS.slow
  return TIME_COLORS.verySlow
}

function getCellStyle(y: number, x: number): Record<string, string> {
  // For y < x, use the card from x, y (symmetric)
  const card = y < x ? getCard(x, y) : getCard(y, x)

  return {
    backgroundColor: LEVEL_COLORS[card.level as keyof typeof LEVEL_COLORS] || BG_COLORS.disabled,
    color: getTimeTextColor(card.time)
  }
}

function resetCardsHandler() {
  showResetDialog(() => {
    resetCards()
    cards.value = loadCards()
  })
}

function toggleExtendedFeature(feature: 'feature1x2' | 'feature1x12' | 'feature1x20') {
  // Toggle feature by updating range
  const newRange = toggleFeature(range.value, feature)
  range.value = newRange
  saveRange(newRange)
}

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page
    class="q-pa-md"
    style="max-width: 1200px; margin: 0 auto"
  >
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        size="md"
        data-cy="back-button"
        @click="goHome"
      />
    </div>

    <!-- Content -->
    <div>
      <!-- Level Distribution -->
      <LevelDistribution
        :cards="cardsInRange"
        :selected-level="selectedLevel"
        class="q-mb-md"
        @reset="resetCardsHandler"
        @level-click="handleLevelClick"
      />

      <!-- Filtered Cards List -->
      <q-card
        v-if="selectedLevel !== null"
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">
              {{ TEXT_DE.words.level }} {{ selectedLevel }} ({{ sortedFilteredCards.length }})
            </div>
          </div>
          <div style="overflow-y: auto">
            <q-list
              bordered
              separator
            >
              <q-item
                v-for="card in sortedFilteredCards"
                :key="card.question"
              >
                <q-item-section>
                  <q-item-label>{{ card.question }} = {{ card.answer }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :label="`Level ${card.level}`"
                    :style="{
                      backgroundColor:
                        LEVEL_COLORS[card.level as keyof typeof LEVEL_COLORS] || BG_COLORS.disabled
                    }"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <!-- Cards Grid/Matrix -->
      <q-card class="grid-card">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="grid_on"
              class="q-mr-xs"
            />
            {{ TEXT_DE.words.cards }}
          </div>

          <div class="cards-grid-container">
            <div
              class="cards-grid"
              :style="{ gridTemplateColumns: `40px repeat(${xValues.length}, 1fr)` }"
            >
              <!-- Header row with X values -->
              <div class="grid-header"></div>
              <div
                v-for="x in xValues"
                :key="`header-${x}`"
                class="grid-header text-center text-weight-bold"
              >
                {{ x }}
              </div>

              <!-- Rows for each Y value -->
              <template
                v-for="y in yValues"
                :key="`row-${y}`"
              >
                <!-- Y label -->
                <div class="grid-header text-center text-weight-bold">{{ y }}</div>

                <!-- Cells for each X value -->
                <div
                  v-for="x in xValues"
                  :key="`cell-${y}-${x}`"
                  class="grid-cell"
                  :style="getCellStyle(y, x)"
                >
                  <div class="cell-content q-pa-xs">
                    <div class="text-caption text-weight-medium">
                      <!-- Level -->
                      L{{ (y < x ? getCard(x, y) : getCard(y, x)).level }}
                    </div>
                    <!-- Question and Answer -->
                    <div class="cell-answer q-my-xs">{{ y }}x{{ x }}<br />= {{ x * y }}</div>
                    <!-- Time -->
                    <div class="text-caption text-weight-medium">
                      {{ (y < x ? getCard(x, y) : getCard(y, x)).time.toFixed(1) }}s
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Legend -->
          <q-separator class="q-my-md" />
          <div class="legend">
            <div class="text-subtitle2 q-mb-sm text-grey-8">
              <q-icon
                name="info_outline"
                size="18px"
                class="q-mr-xs"
              />
              {{ TEXT_DE.cards.legend }}
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-chip
                  dense
                  square
                  class="legend-chip"
                >
                  <q-icon
                    name="palette"
                    size="16px"
                    class="q-mr-xs"
                  />
                  <span class="text-caption">{{ TEXT_DE.cards.legendBackground }}</span>
                </q-chip>
              </div>
              <div class="col-12 col-sm-6">
                <q-chip
                  dense
                  square
                  class="legend-chip"
                >
                  <q-icon
                    name="schedule"
                    size="16px"
                    class="q-mr-xs"
                  />
                  <span class="text-caption">{{ TEXT_DE.cards.legendTextColor }}</span>
                </q-chip>
              </div>
            </div>
          </div>

          <!-- Extended Cards Section -->
          <q-separator class="q-my-md" />
          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-md text-grey-8">
              <q-icon
                name="extension"
                size="18px"
                class="q-mr-xs"
              />
              {{ TEXT_DE.multiply.extendedCards.title }}
            </div>
            <div class="row items-center q-gutter-md">
              <!-- 1x2 Toggle Button -->
              <q-btn
                :pressed="range.includes(2)"
                unelevated
                :label="TEXT_DE.multiply.extendedCards.feature1x2"
                data-cy="feature-1x2-toggle"
                :color="range.includes(2) ? 'primary' : 'grey-5'"
                @click="toggleExtendedFeature('feature1x2')"
              />

              <!-- 1x12 Toggle Button -->
              <q-btn
                :pressed="range.includes(11)"
                unelevated
                :label="TEXT_DE.multiply.extendedCards.feature1x12"
                data-cy="feature-1x12-toggle"
                :color="range.includes(11) ? 'primary' : 'grey-5'"
                @click="toggleExtendedFeature('feature1x12')"
              />

              <!-- 1x20 Toggle Button -->
              <q-btn
                :pressed="range.includes(13)"
                unelevated
                :label="TEXT_DE.multiply.extendedCards.feature1x20"
                data-cy="feature-1x20-toggle"
                :color="range.includes(13) ? 'primary' : 'grey-5'"
                @click="toggleExtendedFeature('feature1x20')"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
/* Essential grid system - CSS Grid is optimal for multiplication table layout */
.cards-grid-container {
  overflow-x: auto;
}

.cards-grid {
  display: grid;
  gap: 6px;
  min-width: 700px;
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: #616161;
}

.grid-cell {
  aspect-ratio: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  min-height: 100px;
  min-width: 100px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.grid-cell:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.cell-content {
  text-align: center;
  width: 100%;
}

.cell-answer {
  font-weight: 700;
  font-size: 1.1rem;
}

/* Mobile: compact grid */
@media (max-width: 599.98px) {
  .cards-grid {
    grid-template-columns: 28px repeat(7, 1fr);
    gap: 3px;
    min-width: 360px;
  }

  .grid-cell {
    min-height: 85px;
    min-width: 85px;
    border-width: 1px;
  }

  .cell-content {
    padding: 2px !important;
  }

  .cell-answer {
    font-size: 0.8rem;
    line-height: 1.1;
  }

  .text-caption {
    font-size: 0.65rem !important;
  }
}
</style>
