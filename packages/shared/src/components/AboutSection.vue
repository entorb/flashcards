<script setup lang="ts">
import { QIcon } from 'quasar'
import { onBeforeUnmount, ref } from 'vue'

import { SHARE_URL } from '../constants'
import { TEXT_DE } from '../text-de'

defineProps<{
  contactOrigin: string
}>()

const shareIcon = ref<string>('share')
const shareLabel = ref<string>(TEXT_DE.shared.info.aboutShare)
const shareButtonTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

onBeforeUnmount(() => {
  if (shareButtonTimeout.value) {
    clearTimeout(shareButtonTimeout.value)
  }
})

const resetShareAfterDelay = (icon: string) => {
  if (shareButtonTimeout.value) {
    clearTimeout(shareButtonTimeout.value)
  }
  shareButtonTimeout.value = setTimeout(() => {
    shareIcon.value = 'share'
    shareLabel.value = TEXT_DE.shared.info.aboutShare
  }, 10000)
  shareIcon.value = icon
  shareLabel.value = TEXT_DE.shared.cardActions.copied
}

const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(SHARE_URL)
    resetShareAfterDelay('check')
  } catch {
    resetShareAfterDelay('error_outline')
  }
}
</script>

<template>
  <div>
    <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
      {{ TEXT_DE.shared.info.aboutTitle }}
    </h3>
    <p>
      {{ TEXT_DE.shared.info.aboutPrefix }}
      <a
        :href="`https://entorb.net/contact.php?origin=${contactOrigin}`"
        target="_blank"
        rel="noopener noreferrer"
        >{{ TEXT_DE.shared.info.aboutTorben }}</a
      >&nbsp;<a
        href="https://github.com/entorb/flashcards"
        target="_blank"
        rel="noopener noreferrer"
        >{{ TEXT_DE.shared.info.aboutOpenSource }}</a
      >&nbsp;<a
        href="https://entorb.net/flashcards/"
        target="_blank"
        rel="noopener noreferrer"
        >{{ TEXT_DE.shared.info.aboutProject }}</a
      >
      {{ TEXT_DE.shared.info.aboutSuffix }}
    </p>
    <button
      type="button"
      class="share-button"
      :title="TEXT_DE.shared.info.aboutShare"
      @click="handleShare"
    >
      <QIcon
        :name="shareIcon"
        size="xs"
      />&nbsp;<span>{{ shareLabel }}</span>
    </button>
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
