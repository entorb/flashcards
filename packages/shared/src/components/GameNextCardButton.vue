<script setup lang="ts">
import { TEXT_DE } from '../text-de'

interface Props {
  answerData?: { isCorrect: boolean }
  color?: string
  icon?: string
  isButtonDisabled: boolean
  isEnterDisabled: boolean
  buttonDisableCountdown: number
}

defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <q-btn
    size="lg"
    class="full-width"
    :color="color || (answerData?.isCorrect ? 'positive' : 'negative')"
    :disable="isButtonDisabled || isEnterDisabled"
    :label="
      isButtonDisabled || isEnterDisabled
        ? `${TEXT_DE.shared.common.wait} ${buttonDisableCountdown}`
        : TEXT_DE.shared.common.continue
    "
    data-cy="continue-button"
    :icon="icon || (answerData?.isCorrect ? 'check_circle' : 'cancel')"
    @click="handleClick"
  />
</template>
