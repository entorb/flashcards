<script setup lang="ts">
/**
 * Reusable toggle button group with Req 8 toggle behavior:
 * 1. All selected + tap one → select only that one
 * 2. One selected + tap same → select all
 * 3. One selected + tap different → add to selection
 * 4. Multiple (not all) selected + tap selected → select all
 */

interface ButtonConfig {
  value: string
  label: string
  icon?: string
  dataCy: string
}

const props = defineProps<{
  title: string
  buttons: ButtonConfig[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

function emitSelection(values: string[]) {
  emit('update:modelValue', values)
}

function toggle(value: string) {
  const allValues = props.buttons.map(b => b.value)
  const current = props.modelValue
  const allSelected = allValues.every(v => current.includes(v))

  if (allSelected) {
    emitSelection([value])
  } else if (current.includes(value)) {
    emitSelection([...allValues])
  } else {
    emitSelection([...current, value])
  }
}
</script>

<template>
  <div class="q-mb-sm">
    <div class="text-subtitle2 q-mb-xs">
      {{ title }}
    </div>
    <div class="row q-gutter-xs">
      <q-btn
        v-for="btn in buttons"
        :key="btn.value"
        :outline="!modelValue.includes(btn.value)"
        :unelevated="modelValue.includes(btn.value)"
        :color="modelValue.includes(btn.value) ? 'primary' : 'grey-5'"
        size="md"
        class="col"
        :data-cy="btn.dataCy"
        @click="toggle(btn.value)"
      >
        <q-icon
          v-if="btn.icon"
          :name="btn.icon"
          size="xs"
          class="q-mr-xs"
        />
        <span class="text-body1">{{ btn.label }}</span>
      </q-btn>
    </div>
  </div>
</template>
