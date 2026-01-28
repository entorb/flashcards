<script setup lang="ts">
import {
  FIRST_GAME_BONUS,
  SPEED_BONUS_POINTS,
  STREAK_GAME_BONUS,
  STREAK_GAME_INTERVAL
} from '../constants'
import { TEXT_DE } from '../text-de'

defineProps<{
  appName: '1x1' | 'lwk' | 'voc'
  pointsModeHidden?: number
  pointsModeBlind?: number
  pointsModeTyping?: number
  pointsLanguageDirection?: number
}>()

defineEmits<{
  back: []
}>()
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
        <!-- Base Points Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.scoring.basePointsTitle }}
          </h3>
          <ul class="q-pl-md q-mt-sm">
            <li>
              {{ TEXT_DE.shared.scoring.basePointsLevel1 }}
            </li>
            <li>
              {{ TEXT_DE.shared.scoring.basePointsLevel2 }}
            </li>
            <li>
              {{ TEXT_DE.shared.scoring.basePointsLevel3 }}
            </li>
            <li>
              {{ TEXT_DE.shared.scoring.basePointsLevel4 }}
            </li>
            <li>
              {{ TEXT_DE.shared.scoring.basePointsLevel5 }}
            </li>
          </ul>
        </div>

        <!-- Mode Section -->
        <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ TEXT_DE.shared.scoring.difficultyTitle }}
        </h3>
        <div v-if="appName === '1x1'">
          <ul class="q-pl-md q-mt-sm">
            <li>
              {{ TEXT_DE['multiply'].info.difficulty }}
            </li>
          </ul>
        </div>
        <div v-else-if="appName === 'lwk'">
          <ul class="q-pl-md q-mt-sm">
            <li>
              {{ TEXT_DE.lwk.info.modeCopy }}
            </li>
            <li>
              {{
                TEXT_DE.lwk.info.modeHidden.replace('{points}', (pointsModeHidden ?? 4).toString())
              }}
            </li>
          </ul>
        </div>
        <div v-else-if="appName === 'voc'">
          <ul class="q-pl-md q-mt-sm">
            <li>
              {{ TEXT_DE.voc.info.modeChoice }}
            </li>
            <li>
              {{
                TEXT_DE.voc.info.modeBlind.replace('{points}', (pointsModeBlind ?? 4).toString())
              }}
            </li>
            <li>
              {{
                TEXT_DE.voc.info.modeTyping.replace('{points}', (pointsModeTyping ?? 8).toString())
              }}
            </li>
          </ul>
        </div>

        <!-- Additional Rules Section -->
        <div v-if="appName === 'lwk'">
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.lwk.info.additionalRulesTitle }}
          </h3>
          <p>
            {{ TEXT_DE.lwk.info.closeMatchDescription }}
          </p>
        </div>
        <div v-else-if="appName === 'voc'">
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.voc.info.additionalRulesTitle }}
          </h3>
          <ul class="q-pl-md">
            <li>
              {{ TEXT_DE.voc.info.closeMatchDescription }}
            </li>
            <li>
              {{
                TEXT_DE.voc.info.additionalRuleLangDirection.replace(
                  '{points}',
                  (pointsLanguageDirection ?? 1).toString()
                )
              }}
            </li>
          </ul>
        </div>

        <!-- Bonus Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.scoring.bonusTitle }}
          </h3>
          <ul class="q-pl-md">
            <li>
              {{
                TEXT_DE.shared.scoring.speedBonusDescription.replace(
                  '{points}',
                  SPEED_BONUS_POINTS.toString()
                )
              }}
            </li>
            <li>
              {{
                TEXT_DE.shared.scoring.dailyBonusFirstGame.replace(
                  '{points}',
                  FIRST_GAME_BONUS.toString()
                )
              }}
            </li>
            <li>
              {{
                TEXT_DE.shared.scoring.dailyBonusStreak
                  .replace('{interval}', STREAK_GAME_INTERVAL.toString())
                  .replace('{points}', STREAK_GAME_BONUS.toString())
              }}
            </li>
          </ul>
        </div>
      </div>
    </q-page>
  </div>
</template>
