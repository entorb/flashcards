<script setup lang="ts">
import { GameOverPage } from '@flashcards/shared/pages'

import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { useGameStore } from '@/composables/useGameStore'
import { BASE_PATH, FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL } from '@/constants'
import {
  clearGameResult,
  getGameResult,
  incrementDailyGames,
  loadGameStats,
  saveGameStats,
  saveHistory
} from '@/services/storage'

const { history: gameStoreHistory } = useGameStore()
</script>

<template>
  <GameOverPage
    :storage-functions="{
      getGameResult,
      clearGameResult,
      incrementDailyGames,
      loadGameStats,
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
  >
    <template #mascot="{ isHappy, isGrinning }">
      <GroundhogMascot
        :smile="isHappy"
        :grin="isGrinning"
        style="width: 150px; height: 150px"
      />
    </template>
  </GameOverPage>
</template>
