<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        data-cy="back-button"
        @click="goBack"
      />
      <div
        class="text-h5 q-ml-sm"
        data-cy="info-page-title"
      >
        {{ TEXT_DE.lwk.info.title }}
      </div>
    </div>

    <div class="q-gutter-md">
      <p>{{ TEXT_DE.lwk.info.description }}</p>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.basePointsTitle }}</div>
          <p>{{ TEXT_DE.lwk.info.basePointsDescription }}</p>
          <ul>
            <li>{{ TEXT_DE.lwk.info.basePointsLevel1 }}</li>
            <li>{{ TEXT_DE.lwk.info.basePointsLevel2 }}</li>
            <li>{{ TEXT_DE.lwk.info.basePointsLevel3 }}</li>
            <li>{{ TEXT_DE.lwk.info.basePointsLevel4 }}</li>
            <li>{{ TEXT_DE.lwk.info.basePointsLevel5 }}</li>
          </ul>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.modeTitle }}</div>
          <ul>
            <li>{{ TEXT_DE.lwk.info.modeCopy }}</li>
            <li>{{ TEXT_DE.lwk.info.modeHidden }}</li>
          </ul>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.closeMatchTitle }}</div>
          <p>{{ TEXT_DE.lwk.info.closeMatchDescription }}</p>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.speedBonusTitle }}</div>
          <p>{{ TEXT_DE.lwk.info.speedBonusDescription }}</p>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.dailyBonusesTitle }}</div>
          <ul>
            <li>{{ TEXT_DE.lwk.info.dailyBonusFirstGame }}</li>
            <li>{{ TEXT_DE.lwk.info.dailyBonusStreak }}</li>
          </ul>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">{{ TEXT_DE.lwk.info.mascotTitle }}</div>
          <p>{{ TEXT_DE.lwk.info.mascotDescription }}</p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
