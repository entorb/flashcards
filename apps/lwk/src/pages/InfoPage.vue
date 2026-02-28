<script setup lang="ts">
import { InfoPage } from '@flashcards/shared/pages'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { POINTS_MODE_HIDDEN } from '../constants'

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
    app-name="lwk"
    :points-mode-hidden="POINTS_MODE_HIDDEN"
    @back="handleBack"
  />
</template>
