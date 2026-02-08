<script setup lang="ts">
import { computed } from 'vue'

import ConfigView from './components/ConfigView.vue'
import TrackingView from './components/TrackingView.vue'
import { useEtaStore } from './composables/useEtaStore'

const store = useEtaStore()

const showConfig = computed(() => !store.isSessionActive.value)

store.initialize()
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex items-start justify-center">
        <ConfigView v-if="showConfig" />
        <TrackingView v-else />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
