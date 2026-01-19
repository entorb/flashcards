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
        <q-tooltip>{{ TEXT_DE.shared.nav.backToHome }}</q-tooltip>
      </q-btn>
      <q-toolbar-title
        class="text-center"
        data-cy="info-page-title"
        >{{ TEXT_DE.shared.scoring.title }}</q-toolbar-title
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
        {{ TEXT_DE.lwk.info.description }}
      </p>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.shared.scoring.basePointsTitle }}
        </h3>
        <p>
          {{ TEXT_DE.shared.scoring.basePointsDescription }}
        </p>
        <ul class="q-pl-md q-mt-sm">
          <li>
            <strong class="text-primary">{{ TEXT_DE.shared.scoring.basePointsLevel1 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.shared.scoring.basePointsLevel2 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.shared.scoring.basePointsLevel3 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.shared.scoring.basePointsLevel4 }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.shared.scoring.basePointsLevel5 }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.lwk.info.modeTitle }}
        </h3>
        <ul class="q-pl-md q-mt-sm">
          <li>
            <strong class="text-primary">{{ TEXT_DE.lwk.info.modeCopy }}</strong>
          </li>
          <li>
            <strong class="text-primary">{{ TEXT_DE.lwk.info.modeHidden }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.lwk.info.closeMatchTitle }}
        </h3>
        <p>
          {{ TEXT_DE.lwk.info.closeMatchDescription }}
        </p>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.shared.scoring.speedBonusTitle }}
        </h3>
        <p>
          <strong class="text-positive">{{ TEXT_DE.shared.scoring.speedBonusDescription }}</strong>
        </p>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.shared.scoring.dailyBonusesTitle }}
        </h3>
        <ul class="q-pl-md">
          <li class="q-mb-sm">
            <strong class="text-positive">{{ TEXT_DE.shared.scoring.dailyBonusFirstGame }}</strong>
          </li>
          <li>
            <strong class="text-positive">{{ TEXT_DE.shared.scoring.dailyBonusStreak }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.lwk.info.mascotTitle }}
        </h3>
        <p>
          {{ TEXT_DE.lwk.info.mascotDescription }}
        </p>
      </div>
    </div>
  </q-page>
</template>
