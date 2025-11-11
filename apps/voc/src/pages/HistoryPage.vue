<script setup lang="ts">
import { getFocusText, TEXT_DE } from '@flashcards/shared'
import { HistoryPage } from '@flashcards/shared/pages'

import { useGameStore } from '../composables/useGameStore'
import type { GameHistory } from '../types'

const { history } = useGameStore()

function getModeText(mode: string): string {
  const modes: Record<string, string> = {
    'multiple-choice': TEXT_DE.voc.mode.multipleChoice,
    blind: TEXT_DE.voc.mode.blind,
    typing: TEXT_DE.voc.mode.typing
  }
  return modes[mode] || mode
}

function formatDetails(game: GameHistory): string {
  const mode = getModeText(game.settings.mode)
  const focus = `${TEXT_DE.words.focus}: ${getFocusText(game.settings.focus)}`
  const deck = game.settings.deck ? `${TEXT_DE.words.deck}: ${game.settings.deck}` : ''
  const parts = [deck, mode, focus, game.settings.language]
  return parts.join(' | ')
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
