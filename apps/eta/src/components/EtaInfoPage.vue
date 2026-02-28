<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { AboutSection } from '@flashcards/shared/components'
import { QIcon } from 'quasar'

import { BASE_PATH } from '@/constants'

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
        <AboutSection :contact-origin="BASE_PATH" />
      </div>
    </q-page>
  </div>
</template>
