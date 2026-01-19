<script setup lang="ts">
import { getFocusText, TEXT_DE } from '@flashcards/shared'
import { HistoryPage } from '@flashcards/shared/pages'

import { useGameStore } from '../composables/useGameStore'
import type { GameHistory } from '../types'

const { history } = useGameStore()

function getModeText(mode: string): string {
  const modes: Record<string, string> = {
    copy: TEXT_DE.lwk.mode.copy,
    hidden: TEXT_DE.lwk.mode.hidden
  }
  return modes[mode] || mode
}

function formatDetails(game: GameHistory): string {
  const mode = getModeText(game.settings.mode)
  const focus = `${TEXT_DE.shared.words.focus}: ${getFocusText(game.settings.focus)}`
  const deck = game.settings.deck ? `${TEXT_DE.shared.words.deck}: ${game.settings.deck}` : ''
  const parts = [deck, mode, focus]
  return parts.filter(Boolean).join(' | ')
}

function getPoints(entry: GameHistory): number {
  return Math.round(entry.points)
}

function getCorrectAnswers(entry: GameHistory): string {
  return `${entry.correctAnswers}`
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
