<script setup lang="ts">
import { MAX_LEVEL, MIN_LEVEL } from '../constants'
import { TEXT_DE } from '../text-de'

interface Props {
  appPrefix: 'voc' | 'lwk'
  targetLevel: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:targetLevel': [value: number]
  moveClick: []
  resetClick: []
}>()

function handleMoveClick() {
  emit('moveClick')
}

function handleResetClick() {
  emit('resetClick')
}

function updateTargetLevel(value: string | number | null) {
  if (typeof value === 'number') {
    emit('update:targetLevel', value)
  } else if (typeof value === 'string') {
    const num = Number.parseInt(value, 10)
    if (!Number.isNaN(num)) {
      emit('update:targetLevel', num)
    }
  }
}
</script>

<template>
  <!-- Advanced Actions -->
  <q-card>
    <q-card-section>
      <div class="text-h6 q-mb-sm">
        <q-icon
          name="tune"
          class="q-mr-sm"
        />
        {{ TEXT_DE[appPrefix].cards.moveAllTitle }}
      </div>
      <div class="row q-gutter-sm items-center">
        <q-input
          :model-value="targetLevel"
          type="number"
          :min="MIN_LEVEL"
          :max="MAX_LEVEL"
          outlined
          dense
          label="Level"
          style="width: 120px"
          @update:model-value="updateTargetLevel"
        />
        <q-btn
          outline
          color="primary"
          icon="arrow_forward"
          :label="TEXT_DE.shared.cardActions.moveAll"
          no-caps
          @click="handleMoveClick"
        />
      </div>
    </q-card-section>
  </q-card>

  <!-- Danger Zone -->
  <q-card class="bg-red-1">
    <q-card-section>
      <div class="text-h6 q-mb-sm text-negative">
        <q-icon
          name="warning"
          class="q-mr-sm"
        />
        {{ TEXT_DE.shared.cardActions.dangerZoneTitle }}
      </div>
      <q-btn
        outline
        color="negative"
        icon="delete_forever"
        :label="TEXT_DE[appPrefix].cards.reset"
        no-caps
        @click="handleResetClick"
      />
    </q-card-section>
  </q-card>
</template>
