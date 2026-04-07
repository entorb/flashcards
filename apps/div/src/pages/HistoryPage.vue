<script setup lang="ts">
import { getFocusText, TEXT_DE } from '@flashcards/shared'
import { HistoryPage } from '@flashcards/shared/pages'
import { onMounted, ref } from 'vue'

import { loadHistory } from '@/services/storage'
import type { GameHistory } from '@/types'

const history = ref<GameHistory[]>([])

onMounted(() => {
  history.value = loadHistory()
})

function formatSelection(select: number[]): string {
  return select.join(', ')
}

function formatDetails(game: GameHistory): string {
  const selection = `${TEXT_DE.divide.selection}: ${formatSelection(game.settings.select)}`
  const focus = `${TEXT_DE.shared.words.focus}: ${getFocusText(game.settings.focus)}`
  return `${selection} | ${focus}`
}

function getPoints(game: GameHistory): number {
  return game.points
}

function getCorrectAnswers(game: GameHistory): string {
  return `${game.correctAnswers}`
}
</script>

<template>
  <HistoryPage
    :history="history"
    :format-details="formatDetails"
    :get-points="getPoints"
    :get-correct-answers="getCorrectAnswers"
  />
</template>
