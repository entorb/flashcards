<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { TEXT_DE } from '../text-de'

interface Props {
  modelValue: string | number | null
  buttonDisabled: boolean
  onSubmit: () => void
  inputType: 'text' | 'numeric'
  shouldFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shouldFocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const pattern = computed(() => (props.inputType === 'numeric' ? '[0-9]*' : undefined))
const inputRules = computed(() =>
  props.inputType === 'numeric' ? [(val: unknown) => val === null || Number.isInteger(val)] : []
)

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const canSubmit = computed(
  () =>
    model.value !== null && model.value !== undefined && model.value !== '' && !props.buttonDisabled
)

// Watch for shouldFocus prop to programmatically focus
watch(
  () => props.shouldFocus,
  newVal => {
    if (newVal) {
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)
</script>

<template>
  <!-- Answer Input Section -->
  <div>
    <!-- eslint-disable vuejs-accessibility/no-autofocus -->
    <q-input
      ref="inputRef"
      v-model="model"
      type="text"
      :inputmode="props.inputType"
      :pattern="pattern"
      outlined
      class="q-mb-md"
      autofocus
      input-class="text-h3 text-center"
      :rules="inputRules"
      data-cy="answer-input"
      @keyup.enter="canSubmit && props.onSubmit()"
    >
      <template #prepend>
        <q-icon
          name="edit"
          color="primary"
        />
      </template>
    </q-input>
    <!-- eslint-enable vuejs-accessibility/no-autofocus -->

    <q-btn
      color="primary"
      size="lg"
      class="full-width q-mb-md"
      :disable="!canSubmit"
      icon="check"
      :label="TEXT_DE.shared.common.check"
      data-cy="submit-answer-button"
      @click="props.onSubmit"
    />
  </div>
</template>
