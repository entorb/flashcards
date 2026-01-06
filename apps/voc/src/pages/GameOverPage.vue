<script setup lang="ts">
import { GameOverPage } from '@flashcards/shared/pages'

import FoxIcon from '../components/FoxMascot.vue'
import { useGameStore } from '../composables/useGameStore'
import { BASE_PATH, FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL } from '../constants'
import {
  clearGameResult,
  clearGameState,
  getGameResult,
  incrementDailyGames,
  saveGameStats,
  saveHistory
} from '../services/storage'

const { history: gameStoreHistory, gameStats: gameStoreStats } = useGameStore()
</script>

<template>
  <GameOverPage
    :storage-functions="{
      getGameResult,
      clearGameResult,
      clearGameState,
      incrementDailyGames,
      saveGameStats,
      saveHistory
    }"
    :bonus-config="{
      firstGameBonus: FIRST_GAME_BONUS,
      streakGameBonus: STREAK_GAME_BONUS,
      streakGameInterval: STREAK_GAME_INTERVAL
    }"
    :base-path="BASE_PATH"
    :game-store-history="gameStoreHistory"
    :game-store-stats="gameStoreStats"
  >
    <template #mascot="{ isHappy, isGrinning }">
      <FoxIcon
        :is-happy="isHappy"
        :is-grinning="isGrinning"
        :size="150"
      />
    </template>
  </GameOverPage>
</template>
