<script setup lang="ts">
import { NumericGamePage } from "@flashcards/shared/pages"

import { useGameStore } from "@/composables/useGameStore.ts"
import { formatDisplayQuestion } from "@/utils/questionFormatter.ts"

const store = useGameStore()

function formatQuestion(question: string): string {
  return formatDisplayQuestion(question)
}
</script>

<template>
  <NumericGamePage
    :store="store"
    :format-question="formatQuestion"
  />
</template>
