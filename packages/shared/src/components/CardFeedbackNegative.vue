<script setup lang="ts">
interface Props {
  status: 'close' | 'incorrect'
  userAnswer: string
  correctAnswer: string
}

defineProps<Props>()
</script>

<template>
  <q-card
    class="q-mb-md"
    data-cy="wrong-answer-feedback"
  >
    <q-card-section class="text-center q-pa-md">
      <div class="row items-center justify-center text-h5">
        <span
          :class="
            status === 'close' ? 'text-warning text-weight-bold' : 'text-negative text-weight-bold'
          "
          style="text-decoration: line-through; text-decoration-thickness: 3px"
          >{{ userAnswer }}</span
        >
        <q-icon
          name="arrow_forward"
          size="sm"
          class="q-mx-sm"
        />
        <span class="text-positive text-weight-bold text-h4">{{ correctAnswer }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>
