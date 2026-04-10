<script setup lang="ts">
import { InfoPage } from '@flashcards/shared/pages'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// InfoPage now accepts 'pum' as a valid appName
const appName = 'pum'

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
    :app-name="appName"
    @back="handleBack"
  />
</template>
