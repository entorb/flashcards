<script setup lang="ts">
interface Props {
  currentIndex: number
  totalCards: number
  points: number
  totalCardsOverride?: number
}

defineProps<Props>()
const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="row items-center justify-between q-mb-md">
    <q-btn
      flat
      round
      icon="arrow_back"
      size="md"
      data-cy="back-button"
      @click="emit('back')"
    />
    <div class="text-h6 text-weight-bold">
      <q-icon
        name="emoji_events"
        color="amber"
        size="24px"
      />
      {{ points }}
    </div>
    <div
      class="text-h6 text-weight-bold"
      data-cy="card-counter"
    >
      <template v-if="totalCardsOverride !== undefined">
        {{ totalCardsOverride }}
      </template>
      <template v-else> {{ currentIndex + 1 }} / {{ totalCards }} </template>
    </div>
  </div>
</template>
