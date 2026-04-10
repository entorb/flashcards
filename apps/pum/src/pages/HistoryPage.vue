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

const operationLabels: Record<string, string> = {
  plus: TEXT_DE.plusMinus.selection.plus,
  minus: TEXT_DE.plusMinus.selection.minus
}

const difficultyLabels: Record<string, string> = {
  simple: TEXT_DE.plusMinus.selection.simple,
  medium: TEXT_DE.plusMinus.selection.medium,
  advanced: TEXT_DE.plusMinus.selection.advanced
}

function formatOperations(ops: string[]): string {
  return ops.map(op => operationLabels[op] ?? op).join(', ')
}

function formatDifficulties(diffs: string[]): string {
  return diffs.map(d => difficultyLabels[d] ?? d).join(', ')
}

function formatDetails(game: GameHistory): string {
  const ops = `${TEXT_DE.plusMinus.selection.operations}: ${formatOperations(game.settings.operations)}`
  const diffs = `${TEXT_DE.plusMinus.selection.difficulties}: ${formatDifficulties(game.settings.difficulties)}`
  const focus = `${TEXT_DE.shared.words.focus}: ${getFocusText(game.settings.focus)}`
  return `${ops} | ${diffs} | ${focus}`
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
