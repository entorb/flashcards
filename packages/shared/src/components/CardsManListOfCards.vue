<script setup lang="ts">
import { LEVEL_COLORS, MAX_TIME } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'

interface Props {
  allCards: BaseCard[]
  cardsToShow: BaseCard[]
  selectedLevel: number | null
  getLabel: (card: BaseCard) => string
  getKey: (card: BaseCard) => string
}

defineProps<Props>()

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] || LEVEL_COLORS[1]
}
</script>

<template>
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
            :key="getKey(card)"
          >
            <q-item-section>
              <q-item-label>{{ getLabel(card) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :label="`Level ${card.level}`"
                :style="{ backgroundColor: getLevelColor(card.level) }"
              />
              <!-- Do not display the time when it equals MAX_TIME (default/sentinel value) -->
              <div
                v-if="card.time < MAX_TIME"
                class="text-caption text-grey-7 q-mt-xs"
              >
                {{ card.time }}s
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
  </q-card>
</template>
