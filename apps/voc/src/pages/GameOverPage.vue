<script setup lang="ts">
import { useGameStore } from '../composables/useGameStore'
import { GameOverPage } from '@flashcards/shared/pages'
import { BASE_PATH, FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL } from '../constants'
import FoxIcon from '../components/FoxIcon.vue'
import {
  incrementDailyGames,
  loadGameStats,
  saveGameStats,
  saveHistory,
  getGameResult,
  clearGameResult
} from '../services/storage'

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
      <FoxIcon
        :is-happy="isHappy"
        :is-grinning="isGrinning"
        :size="150"
      />
    </template>
  </GameOverPage>
</template>
