<script setup lang="ts">
import { SHARE_URL, TEXT_DE } from '@flashcards/shared'
import { QIcon } from 'quasar'
import { onBeforeUnmount, ref } from 'vue'

import { BASE_PATH } from '@/constants'

defineEmits<{
  back: []
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
    <q-header
      elevated
      class="bg-white text-grey-9"
    >
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          data-cy="back-button"
          @click="$emit('back')"
        >
          <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
        </q-btn>
        <q-toolbar-title
          class="text-center"
          data-cy="info-page-title"
          >{{ TEXT_DE.eta.info.title }}</q-toolbar-title
        >
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          style="visibility: hidden"
        />
      </q-toolbar>
    </q-header>

    <q-page class="q-pa-md">
      <div
        class="q-mx-auto q-gutter-lg text-grey-8"
        style="max-width: 700px"
      >
        <!-- Description -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.eta.info.descriptionTitle }}
          </h3>
          <p>{{ TEXT_DE.eta.info.description }}</p>
        </div>

        <!-- How To -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.eta.info.howToTitle }}
          </h3>
          <ol class="q-pl-md q-mt-sm">
            <li>{{ TEXT_DE.eta.info.step1 }}</li>
            <li>{{ TEXT_DE.eta.info.step2 }}</li>
            <li>{{ TEXT_DE.eta.info.step3 }}</li>
          </ol>
        </div>

        <!-- Tips -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.eta.info.tipTitle }}
          </h3>
          <ul class="q-pl-md q-mt-sm">
            <li>
              <QIcon
                name="add"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.eta.info.tipPlusOne }}
            </li>
            <li>
              <QIcon
                name="swap_horiz"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.eta.info.tipToggle }}
            </li>
            <li>
              <QIcon
                name="bar_chart"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.eta.info.tipTable }}
            </li>
          </ul>
        </div>

        <q-separator />

        <!-- About Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.aboutTitle }}
          </h3>
          <p>
            {{ TEXT_DE.shared.info.aboutPrefix }}
            <a
              :href="`https://entorb.net/contact.php?origin=${BASE_PATH}`"
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
      </div>
    </q-page>
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
