<script setup lang="ts">
import { TEXT_DE } from "../text-de.ts"
import type { AnswerStatus } from "../types.ts"

interface Props {
  status: AnswerStatus
  iconSize?: string
  showContinueButton?: boolean
  isButtonDisabled?: boolean
}

type Emits = (e: "continue") => void

/* eslint-disable vue/no-boolean-default */
withDefaults(defineProps<Props>(), {
  iconSize: "80px",
  showContinueButton: true,
  isButtonDisabled: false,
})
/* eslint-enable vue/no-boolean-default */

const emit = defineEmits<Emits>()

function handleContinue() {
  emit("continue")
}

const STYLE: Record<
  AnswerStatus,
  { icon: string; bg: string; buttonBg: string; dataCy: string; color: string }
> = {
  correct: {
    icon: "check_circle",
    bg: "bg-positive",
    buttonBg: "bg-positive-1",
    dataCy: "correct-answer-feedback",
    color: "positive",
  },
  close: { icon: "warning", bg: "bg-warning", buttonBg: "bg-warning-1", dataCy: "", color: "warning" },
  incorrect: {
    icon: "cancel",
    bg: "bg-negative",
    buttonBg: "bg-negative-1",
    dataCy: "wrong-answer-feedback",
    color: "negative",
  },
}
</script>

<template>
  <q-card
    class="q-mb-md"
    :data-cy="STYLE[status].dataCy"
  >
    <!-- Icon Section -->
    <q-card-section
      :class="[STYLE[status].bg]"
      class="text-white text-center q-pa-lg"
    >
      <q-icon
        :name="STYLE[status].icon"
        color="white"
        :size="iconSize"
        class="q-mb-md"
      />

      <!-- Header slot for status text or points -->
      <!-- eslint-disable-next-line vue/require-explicit-slots -->
      <slot name="header" />
    </q-card-section>

    <!-- Details Section -->
    <q-card-section
      v-if="$slots['details']"
      class="text-center q-pa-lg"
    >
      <!-- eslint-disable-next-line vue/require-explicit-slots -->
      <slot name="details" />
    </q-card-section>

    <!-- Continue Button -->
    <q-card-actions
      v-if="showContinueButton"
      align="center"
      class="q-pa-md"
      :class="STYLE[status].buttonBg"
    >
      <q-btn
        :color="STYLE[status].color"
        :label="isButtonDisabled ? TEXT_DE.shared.common.wait : TEXT_DE.shared.common.continue"
        size="lg"
        unelevated
        class="full-width text-weight-medium"
        :disable="isButtonDisabled"
        data-cy="continue-button"
        @click="handleContinue"
      />
    </q-card-actions>
  </q-card>
</template>
