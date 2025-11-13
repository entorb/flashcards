<script setup lang="ts">
import { TEXT_DE } from '../text-de'
import type { FocusType } from '../types'

interface Props {
  modelValue: FocusType
  hideLabel?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: FocusType]
}>()

const focusOptions = [
  { label: TEXT_DE.focusOptions.weak, value: 'weak' as const, icon: 'trending_down' },
  { label: TEXT_DE.focusOptions.medium, value: 'medium' as const, icon: 'change_history' },
  { label: TEXT_DE.focusOptions.strong, value: 'strong' as const, icon: 'trending_up' },
  { label: TEXT_DE.focusOptions.slow, value: 'slow' as const, icon: 'schedule' }
]

function handleFocusChange(value: FocusType) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div>
    <div
      v-if="!hideLabel"
      class="text-subtitle2 q-mb-xs"
    >
      {{ TEXT_DE.words.focus }}
    </div>
    <div class="row q-col-gutter-sm">
      <div
        v-for="option in focusOptions"
        :key="option.value"
        class="col-6 col-sm-3"
      >
        <q-btn
          :outline="modelValue !== option.value"
          :color="modelValue === option.value ? 'primary' : 'grey-8'"
          :icon="option.icon"
          :label="option.label"
          no-caps
          class="full-width"
          @click="handleFocusChange(option.value)"
        />
      </div>
    </div>
  </div>
</template>
