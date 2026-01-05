<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleGoBack() {
  router.push('/')
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleGoBack()
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
        @click="handleGoBack"
      >
        <q-tooltip>{{ TEXT_DE.nav.backToHome }}</q-tooltip>
      </q-btn>
      <q-toolbar-title
        class="text-center"
        data-cy="info-page-title"
        >{{ TEXT_DE.multiply.info.title }}</q-toolbar-title
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
      <p>
        {{ TEXT_DE.multiply.info.description }}
      </p>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.multiply.info.basePointsTitle }}
        </h3>
        <p>
          {{ TEXT_DE.multiply.info.basePointsDescription }}
        </p>
        <ul class="q-pl-md q-mt-sm">
          <li>
            <strong class="text-primary">{{ TEXT_DE.multiply.info.basePointsLevel1 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.multiply.info.basePointsLevel2 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.multiply.info.basePointsLevel3 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.multiply.info.basePointsLevel4 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.multiply.info.basePointsLevel5 }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.multiply.info.dailyBonusesTitle }}
        </h3>
        <ul class="q-pl-md">
          <li class="q-mb-sm">
            <strong class="text-positive">{{ TEXT_DE.multiply.info.dailyBonusFirstGame }}</strong>
          </li>
          <li>
            <strong class="text-positive">{{ TEXT_DE.multiply.info.dailyBonusStreak }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.multiply.info.speedBonusTitle }}
        </h3>
        <p>
          <strong class="text-positive">{{ TEXT_DE.multiply.info.speedBonusDescription }}</strong>
        </p>
      </div>
    </div>
  </q-page>
</template>
