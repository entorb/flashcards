<script setup lang="ts">
import type { VNode } from 'vue'

import { TEXT_DE } from '../text-de'
import type { GameStats } from '../types'

import AppFooter from './AppFooter.vue'
import HomePwaInstallInfo from './HomePwaInstallInfo.vue'
import HomeStatisticsCard from './HomeStatisticsCard.vue'

defineProps<{
  appTitle: string
  basePath: string
  statistics: GameStats
  disableStartButton?: boolean
}>()

defineEmits<{
  startGame: []
  goToCards: []
  goToHistory: []
  goToInfo: []
}>()

defineSlots<{
  mascot(): VNode[]
  config(): VNode[]
  'extra-buttons'?(): VNode[]
}>()
</script>

<template>
  <q-page class="q-pa-md">
    <!-- Header with Info Button -->
    <div class="row items-center justify-between q-mb-md">
      <div
        class="text-h5"
        data-cy="app-title"
      >
        {{ appTitle }}
      </div>
      <q-btn
        flat
        round
        dense
        icon="info_outline"
        color="grey-6"
        data-cy="info-button"
        @click="$emit('goToInfo')"
      >
      </q-btn>
    </div>

    <!-- Mascot and Statistics -->
    <div class="row items-center justify-center q-mb-md">
      <div class="col-12 col-sm-auto text-center">
        <slot name="mascot" />
      </div>
      <div
        class="col-12 col-sm"
        :class="$q.screen.gt.xs ? 'q-ml-md' : ''"
      >
        <HomeStatisticsCard
          :statistics="statistics"
          data-cy="statistics-card"
        />
      </div>
    </div>

    <!-- Game Configuration -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pa-md">
        <slot name="config" />
      </q-card-section>
    </q-card>

    <!-- Start Button -->
    <q-btn
      color="positive"
      size="lg"
      class="full-width q-mb-sm"
      icon="play_arrow"
      data-cy="start-button"
      :disable="disableStartButton"
      @click="$emit('startGame')"
    >
      <span class="text-body1">{{ TEXT_DE.shared.common.start }}</span>
    </q-btn>

    <!-- Extra Buttons (e.g., game mode buttons) -->
    <slot name="extra-buttons" />

    <!-- Navigation Buttons -->
    <div class="row q-gutter-sm">
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        icon="layers"
        :label="TEXT_DE.shared.nav.cards"
        data-cy="cards-button"
        @click="$emit('goToCards')"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        icon="history"
        :label="TEXT_DE.shared.nav.history"
        data-cy="history-button"
        @click="$emit('goToHistory')"
      />
    </div>

    <HomePwaInstallInfo class="q-mt-md" />

    <AppFooter :base-path="basePath" />
  </q-page>
</template>
