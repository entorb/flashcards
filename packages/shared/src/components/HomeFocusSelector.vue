<script setup lang="ts">
import { TEXT_DE } from '../text-de'
import type { FocusType } from '../types'

interface Props {
  hideLabel?: boolean
}

defineProps<Props>()
const focus = defineModel<FocusType>({ required: true })

const focusOptions = [
  { label: TEXT_DE.shared.focusOptions.weak, value: 'weak' as const, icon: 'trending_down' },
  { label: TEXT_DE.shared.focusOptions.medium, value: 'medium' as const, icon: 'change_history' },
  { label: TEXT_DE.shared.focusOptions.strong, value: 'strong' as const, icon: 'trending_up' },
  { label: TEXT_DE.shared.focusOptions.slow, value: 'slow' as const, icon: 'schedule' }
]

function handleFocusChange(value: FocusType) {
  focus.value = value
}
</script>

<template>
  <div>
    <div
      v-if="!hideLabel"
      class="text-subtitle2 q-mb-xs"
    >
      {{ TEXT_DE.shared.words.focus }}
    </div>
    <div class="row q-col-gutter-sm">
      <div
        v-for="option in focusOptions"
        :key="option.value"
        class="col-6 col-sm-3"
      >
        <q-btn
          :outline="focus !== option.value"
          :color="focus === option.value ? 'primary' : 'grey-8'"
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
