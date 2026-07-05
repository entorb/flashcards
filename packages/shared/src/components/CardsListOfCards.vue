<script setup lang="ts">
import { computed } from 'vue'
import { LEVEL_COLORS, MAX_TIME } from '../constants'
import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'

interface Props {
  allCards: BaseCard[]
  cardsToShow: BaseCard[]
  selectedLevel: number | null
  getLabel: (card: BaseCard) => string
  getKey: (card: BaseCard) => string
  duplicateKeys?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  duplicateKeys: () => new Set()
})

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? '#ffffff'
}

const sortedCards = computed(() => {
  const cards = [...props.cardsToShow]
  cards.sort((a, b) => props.getLabel(a).localeCompare(props.getLabel(b)))
  return cards
})
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
            v-for="card in sortedCards"
            :key="getKey(card)"
          >
            <q-item-section>
              <q-item-label>
                <q-icon
                  v-if="duplicateKeys.has(getKey(card))"
                  name="warning"
                  color="warning"
                  size="xs"
                  class="q-mr-xs"
                >
                  <q-tooltip>{{ TEXT_DE.shared.cards.duplicateWarning }}</q-tooltip>
                </q-icon>
                {{ getLabel(card) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :label="`Level ${card.level}`"
                :style="{ backgroundColor: getLevelColor(card.level) }"
              />
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
