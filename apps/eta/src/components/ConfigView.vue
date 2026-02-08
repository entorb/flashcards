<script setup lang="ts">
import { TEXT_DE, helperStatsDataRead, helperStatsDataWrite } from '@flashcards/shared'
import { onMounted, ref } from 'vue'

import { useEtaStore } from '@/composables/useEtaStore'
import { BASE_PATH } from '@/constants'

import HourglassIcon from './HourglassIcon.vue'

const store = useEtaStore()
const totalTasks = ref<number | null>(null)
const numTotalUsage = ref<number>(0)

onMounted(async () => {
  numTotalUsage.value = await helperStatsDataRead(BASE_PATH)
})

async function handleStart() {
  if (!totalTasks.value || totalTasks.value <= 0) {
    return
  }
  store.startSession(totalTasks.value)

  // Write stats to database
  await helperStatsDataWrite(BASE_PATH)
}
</script>

<template>
  <div
    class="q-pa-md"
    style="max-width: 400px; width: 100%"
  >
    <div class="text-h4 text-center q-mb-lg">
      {{ TEXT_DE.eta.config.title }}
    </div>

    <div class="text-center q-mb-lg">
      <HourglassIcon :progress="0" />
    </div>

    <q-input
      v-model.number="totalTasks"
      :placeholder="TEXT_DE.eta.config.totalTasksPlaceholder"
      type="number"
      inputmode="numeric"
      filled
      class="q-mb-md"
      data-cy="input-total-tasks"
      @keyup.enter="handleStart"
    >
      <template #prepend>
        <q-icon name="format_list_numbered" />
      </template>
    </q-input>

    <div class="row q-gutter-md">
      <q-btn
        icon="play_arrow"
        color="primary"
        size="lg"
        class="col"
        :disable="!totalTasks || totalTasks <= 0"
        data-cy="btn-start"
        @click="handleStart"
      >
        <q-tooltip>{{ TEXT_DE.shared.common.start }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Footer with Stats -->
    <div class="text-center q-mt-lg q-pa-md text-caption text-grey-7">
      <div class="q-mt-sm text-grey-6">
        {{ numTotalUsage.toLocaleString('de-DE') }}
        {{ TEXT_DE.shared.footer.gamesPlayedByAll }}
        {{ TEXT_DE.shared.footer.noDataStored }}
      </div>
      <div class="q-gutter-x-md q-mt-sm">
        <a
          :href="`https://entorb.net/contact.php?origin=${BASE_PATH}`"
          target="_blank"
          rel="noopener noreferrer"
          >by Torben</a
        >
        <a
          href="https://entorb.net/flashcards/"
          target="_blank"
          rel="noopener noreferrer"
          >Home</a
        >
        <a
          href="https://entorb.net/impressum.php"
          target="_blank"
          rel="noopener noreferrer"
          >Disclaimer</a
        >
        <a
          href="https://github.com/entorb/flashcards"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub</a
        >
      </div>
    </div>
  </div>
</template>
