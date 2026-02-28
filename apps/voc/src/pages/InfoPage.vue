<script setup lang="ts">
import { InfoPage } from '@flashcards/shared/pages'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { POINTS_MODE_BLIND, POINTS_MODE_TYPING, LANGUAGE_BONUS_DE_VOC } from '../constants'

const router = useRouter()

const handleBack = () => {
  router.push('/')
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleBack()
  }
}

onMounted(() => {
  globalThis.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <InfoPage
    app-name="voc"
    :points-mode-blind="POINTS_MODE_BLIND"
    :points-mode-typing="POINTS_MODE_TYPING"
    :points-language-direction="LANGUAGE_BONUS_DE_VOC"
    @back="handleBack"
  />
</template>
