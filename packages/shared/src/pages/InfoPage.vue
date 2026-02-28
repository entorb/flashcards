<script setup lang="ts">
import { QIcon } from 'quasar'
import { onBeforeUnmount, ref } from 'vue'

import {
  FIRST_GAME_BONUS,
  SHARE_URL,
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
          >{{ TEXT_DE.shared.info.title }}</q-toolbar-title
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
        <!-- Card Description -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.cardDescriptionTitle }}
          </h3>
          <p v-if="appName === '1x1'">
            {{ TEXT_DE.shared.info.cardDescription1x1 }}
          </p>
          <p v-else-if="appName === 'voc'">
            {{ TEXT_DE.shared.info.cardDescriptionVoc }}
          </p>
          <p v-else-if="appName === 'lwk'">
            {{ TEXT_DE.shared.info.cardDescriptionLwk }}
          </p>
        </div>

        <!-- Level System Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.levelSystemTitle }}
          </h3>
          <p>{{ TEXT_DE.shared.info.levelSystem }}</p>
        </div>

        <!-- Decks Section (voc & lwk only) -->
        <div v-if="appName === 'voc'">
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.decksTitle }}
          </h3>
          <p>{{ TEXT_DE.shared.info.decksVoc }}</p>
        </div>
        <div v-else-if="appName === 'lwk'">
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.decksTitle }}
          </h3>
          <p>{{ TEXT_DE.shared.info.decksLwk }}</p>
        </div>

        <!-- App Modes Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.modesTitle }}
          </h3>
          <p v-if="appName === '1x1'">
            {{ TEXT_DE.multiply.info.modeDescription }}
          </p>
          <ul
            v-else-if="appName === 'voc'"
            class="q-pl-md q-mt-sm"
          >
            <li>{{ TEXT_DE.voc.info.modeMultipleChoice }}</li>
            <li>{{ TEXT_DE.voc.info.modeBlindInfo }}</li>
            <li>{{ TEXT_DE.voc.info.modeTypingInfo }}</li>
            <li>{{ TEXT_DE.voc.info.modeDirection }}</li>
          </ul>
          <ul
            v-else-if="appName === 'lwk'"
            class="q-pl-md q-mt-sm"
          >
            <li>{{ TEXT_DE.lwk.info.modeCopyInfo }}</li>
            <li>{{ TEXT_DE.lwk.info.modeHiddenInfo }}</li>
          </ul>
        </div>

        <!-- Focus Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.focusTitle }}
          </h3>
          <p>{{ TEXT_DE.shared.info.focusDescription }}</p>
          <ul class="q-pl-md q-mt-sm">
            <li>
              <QIcon
                name="trending_down"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.focusOptions.weak }}
            </li>
            <li>
              <QIcon
                name="change_history"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.focusOptions.medium }}
            </li>
            <li>
              <QIcon
                name="trending_up"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.focusOptions.strong }}
            </li>
            <li>
              <QIcon
                name="schedule"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.focusOptions.slow }}
            </li>
          </ul>
        </div>

        <!-- Start Buttons Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.startButtonsTitle }}
          </h3>
          <ul class="q-pl-md q-mt-sm">
            <li>
              <QIcon
                name="play_arrow"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.info.startStandard }}
            </li>
            <li>
              <QIcon
                name="all_inclusive"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.info.startEndlessLevel1 }}
            </li>
            <li>
              <QIcon
                name="looks_3"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.info.startThreeRounds }}
            </li>
            <li>
              <QIcon
                name="military_tech"
                size="xs"
                class="q-mr-xs"
              />{{ TEXT_DE.shared.info.startEndlessLevel5 }}
            </li>
          </ul>
        </div>

        <q-separator />

        <!-- Scoring Section Header -->
        <h2 class="text-h6 text-weight-bold q-mb-none">
          {{ TEXT_DE.shared.info.scoringSectionTitle }}
        </h2>

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

        <q-separator />

        <!-- About Section -->
        <div>
          <h3 class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ TEXT_DE.shared.info.aboutTitle }}
          </h3>
          <p>
            {{ TEXT_DE.shared.info.aboutPrefix }}
            <a
              :href="`https://entorb.net/contact.php?origin=fc-${appName}`"
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
