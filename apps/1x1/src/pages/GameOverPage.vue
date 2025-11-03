<script setup lang="ts">
import { useGameStore } from '@/composables/useGameStore'
import {
  getGameResult,
  incrementDailyGames,
  clearGameResult,
  saveHistory,
  loadGameStats,
  saveGameStats
} from '@/services/storage'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL, BASE_PATH } from '@/constants'
import { GameOverPage } from '@flashcards/shared/pages'

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
