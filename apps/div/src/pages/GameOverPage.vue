<script setup lang="ts">
import { FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL } from '@flashcards/shared'
import { GameOverPage } from '@flashcards/shared/pages'

import ChickenMascot from '@/components/ChickenMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH } from '@/constants'
import {
  clearGameResult,
  clearGameState,
  getGameResult,
  incrementDailyGames,
  saveGameStats,
  saveHistory
} from '@/services/storage'

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
      <ChickenMascot
        :smile="isHappy"
        :grin="isGrinning"
        :size="150"
      />
    </template>
  </GameOverPage>
</template>
