<script setup lang="ts">
import { QIcon } from 'quasar'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { SHARE_URL } from '../constants'
import { TEXT_DE } from '../text-de'
import { helperStatsDataRead } from '../utils/helper'

interface Props {
  basePath: string
}

const props = defineProps<Props>()

const numTotalGamesPlayedByAll = ref<number>(0)
const shareIcon = ref<string>('share')
const shareLabel = ref<string>(TEXT_DE.shared.cardActions.share)
const shareButtonTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

onMounted(async () => {
  // Fetch total games played by all users from database
  numTotalGamesPlayedByAll.value = await helperStatsDataRead(props.basePath)
})

onBeforeUnmount(() => {
  if (shareButtonTimeout.value) {
    clearTimeout(shareButtonTimeout.value)
  }
})

const resetIconAfterDelay = (icon: string) => {
  if (shareButtonTimeout.value) {
    clearTimeout(shareButtonTimeout.value)
  }
  shareButtonTimeout.value = setTimeout(() => {
    shareIcon.value = 'share'
    shareLabel.value = TEXT_DE.shared.cardActions.share
  }, 10000)
  shareIcon.value = icon
  shareLabel.value = TEXT_DE.shared.cardActions.copied
}

const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(SHARE_URL)
    resetIconAfterDelay('check')
  } catch {
    resetIconAfterDelay('error_outline')
  }
}
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
        :href="`https://entorb.net/contact.php?origin=${props.basePath}`"
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
      <button
        type="button"
        class="share-button"
        :title="TEXT_DE.shared.cardActions.share"
        @click="handleShare"
      >
        <QIcon :name="shareIcon" />&nbsp;<span>{{ shareLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font: inherit;
  display: inline;
  vertical-align: baseline;
}

.share-button:hover {
  opacity: 0.7;
}
</style>
