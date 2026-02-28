<script setup lang="ts">
import { computed, ref } from 'vue'

import ConfigView from './components/ConfigView.vue'
import EtaInfoPage from './components/EtaInfoPage.vue'
import TrackingView from './components/TrackingView.vue'
import { useEtaStore } from './composables/useEtaStore'

const store = useEtaStore()
const showInfo = ref(false)

const showConfig = computed(() => !store.isSessionActive.value && !showInfo.value)
const showTracking = computed(() => store.isSessionActive.value && !showInfo.value)

function goToInfo() {
  showInfo.value = true
}

function goBack() {
  showInfo.value = false
}

store.initialize()
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex items-start justify-center">
        <EtaInfoPage
          v-if="showInfo"
          @back="goBack"
        />
        <ConfigView
          v-else-if="showConfig"
          @go-to-info="goToInfo"
        />
        <TrackingView v-else-if="showTracking" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
