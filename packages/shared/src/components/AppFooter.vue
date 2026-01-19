<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { TEXT_DE } from '../text-de'
import { helperStatsDataRead } from '../utils/helper'

interface Props {
  basePath: string
}

const props = defineProps<Props>()

const numTotalGamesPlayedByAll = ref<number>(0)

onMounted(async () => {
  // Fetch total games played by all users from database
  numTotalGamesPlayedByAll.value = await helperStatsDataRead(props.basePath)
})
</script>

<template>
  <div class="text-center q-mt-lg q-pa-md text-caption text-grey-7 footer-links">
    <div
      v-if="numTotalGamesPlayedByAll && numTotalGamesPlayedByAll > 0"
      class="q-mt-sm text-grey-6"
    >
      {{ numTotalGamesPlayedByAll.toLocaleString('de-DE') }}
      {{ TEXT_DE.shared.footer.gamesPlayedByAll }}
      {{ TEXT_DE.shared.footer.noDataStored }}
    </div>
    <div class="q-gutter-x-md q-mt-sm">
      <a
        :href="`https://entorb.net/contact.php?origin=${basePath}`"
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
</template>
