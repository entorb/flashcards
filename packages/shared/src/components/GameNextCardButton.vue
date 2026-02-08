<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { BUTTON_DISABLE_DURATION } from '../constants'
import { TEXT_DE } from '../text-de'
import type { AnswerStatus } from '../types'

interface Props {
  answerStatus: AnswerStatus
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  disabledChange: [disabled: boolean]
}>()

function handleClick() {
  emit('click')
}

// Internal countdown state
const isButtonDisabled = ref(false)
const buttonDisableCountdown = ref(0)

let buttonDisableTimer: ReturnType<typeof setTimeout> | null = null
let buttonDisableCountdownInterval: ReturnType<typeof setInterval> | null = null

// Start countdown on mount for incorrect/close answers
onMounted(() => {
  if (props.answerStatus === 'incorrect' || props.answerStatus === 'close') {
    isButtonDisabled.value = true
    emit('disabledChange', true)
    buttonDisableCountdown.value = Math.ceil(BUTTON_DISABLE_DURATION / 1000)

    // Update countdown display
    buttonDisableCountdownInterval = setInterval(() => {
      buttonDisableCountdown.value = Math.max(0, buttonDisableCountdown.value - 1)
      if (buttonDisableCountdown.value <= 0 && buttonDisableCountdownInterval) {
        clearInterval(buttonDisableCountdownInterval)
        buttonDisableCountdownInterval = null
        buttonDisableCountdownInterval = null
      }
    }, 1000)

    // Re-enable button after the specified time
    buttonDisableTimer = setTimeout(() => {
      isButtonDisabled.value = false
      buttonDisableCountdown.value = 0
      emit('disabledChange', false)
    }, BUTTON_DISABLE_DURATION)
  }
})

// Cleanup on component unmount
onUnmounted(() => {
  if (buttonDisableTimer) {
    clearTimeout(buttonDisableTimer)
    buttonDisableTimer = null
  }
  if (buttonDisableCountdownInterval) {
    clearInterval(buttonDisableCountdownInterval)
    buttonDisableCountdownInterval = null
  }
  // Ensure parent is notified if unmounting while disabled
  if (isButtonDisabled.value) {
    emit('disabledChange', false)
  }
})

// Determine button color based on answer status and disabled state
const buttonColor = computed(() => {
  // During countdown, show answer result state (only incorrect/close trigger countdown)
  if (isButtonDisabled.value) {
    return props.answerStatus === 'close' ? 'warning' : 'negative'
  }
  // After countdown expires, show primary (blue) color
  return 'primary'
})

// Determine button icon based on answer status and disabled state
const buttonIcon = computed(() => {
  // During countdown, show answer result state (only incorrect/close trigger countdown)
  if (isButtonDisabled.value) {
    return props.answerStatus === 'close' ? 'warning' : 'cancel'
  }
  // After countdown expires, show play_arrow icon
  return 'play_arrow'
})
</script>

<template>
  <q-btn
    size="lg"
    class="full-width"
    :color="buttonColor"
    :disable="isButtonDisabled"
    :label="
      isButtonDisabled
        ? `${TEXT_DE.shared.common.wait} ${buttonDisableCountdown}`
        : TEXT_DE.shared.common.continue
    "
    data-cy="continue-button"
    :icon="buttonIcon"
    @click="handleClick"
  />
</template>
