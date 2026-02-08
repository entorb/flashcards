<script setup lang="ts">
import { computed } from 'vue'

import { TEXT_DE } from '../text-de'

interface Props {
  buttonDisabled: boolean
  onSubmit: () => void
  inputType: 'text' | 'numeric'
}

const props = defineProps<Props>()
const model = defineModel<string | number | null>({ required: true })

const pattern = computed(() => (props.inputType === 'numeric' ? '[0-9]*' : undefined))
const inputRules = computed(() =>
  props.inputType === 'numeric' ? [(val: unknown) => val === null || Number.isInteger(val)] : []
)

const canSubmit = computed(
  () =>
    model.value !== null && model.value !== undefined && model.value !== '' && !props.buttonDisabled
)
</script>

<template>
  <!-- Answer Input Section -->
  <div data-cy="answer-input-container">
    <!-- eslint-disable vuejs-accessibility/no-autofocus -->
    <q-input
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
