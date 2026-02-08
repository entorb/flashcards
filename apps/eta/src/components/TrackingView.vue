<script setup lang="ts">
import { TEXT_DE } from '@flashcards/shared'
import { ref, computed } from 'vue'

import { useEtaStore } from '@/composables/useEtaStore'
import {
  calculateTimePerTask as calcTimePerTask,
  calculateTotalRuntime
} from '@/utils/measurementCalculations'
import { formatDuration, formatClockTime } from '@/utils/timeFormatters'

import HourglassIcon from './HourglassIcon.vue'

const store = useEtaStore()
const inputValue = ref<number | null>(null)
const inputMode = ref<'completed' | 'remaining'>('completed')

// Local computed refs for template access
const sessionData = computed(() => store.sessionData.value)
const currentCompleted = computed(() => store.currentCompleted.value)
const progressPercentage = computed(() => store.progressPercentage.value)

const inputIcon = computed(() => {
  return inputMode.value === 'completed' ? 'check_circle' : 'pending'
})

// Validation for input
const isInputValid = computed(() => {
  if (inputValue.value === null || !sessionData.value) {
    return true // No validation when empty
  }

  if (inputMode.value === 'completed') {
    // In completed mode: must be > current completed and <= total
    return (
      inputValue.value > currentCompleted.value && inputValue.value <= sessionData.value.totalTasks
    )
  } else {
    // In remaining mode: must be >= 0 and < current remaining
    const currentRemaining = sessionData.value.totalTasks - currentCompleted.value
    return inputValue.value >= 0 && inputValue.value < currentRemaining
  }
})

function handleSubmit() {
  if (inputValue.value === null) {
    return
  }

  let completedTasks = inputValue.value
  if (inputMode.value === 'remaining' && store.sessionData.value) {
    completedTasks = store.sessionData.value.totalTasks - inputValue.value
  }

  if (store.addMeasurement(completedTasks)) {
    inputValue.value = null
  }
}

function handlePlusOne() {
  // If there's input, use that value; otherwise add 1
  if (inputValue.value !== null) {
    handleSubmit()
  } else {
    const nextValue = store.currentCompleted.value + 1
    if (store.addMeasurement(nextValue)) {
      inputValue.value = null
    }
  }
}

function toggleMode() {
  inputMode.value = inputMode.value === 'completed' ? 'remaining' : 'completed'
  inputValue.value = null
}

function handleReset() {
  store.resetSession()
}

const timeEstimate = computed(() => store.getTimeEstimates())

const remainingTimeFormatted = computed(() => {
  // If all tasks are complete, show 00:00
  if (sessionData.value && store.isComplete()) {
    return '00:00'
  }

  if (!timeEstimate.value) {
    return null
  }
  return formatDuration(Math.floor(timeEstimate.value.remainingSeconds))
})

const completionTimeFormatted = computed(() => {
  if (!timeEstimate.value) {
    return null
  }
  return formatClockTime(timeEstimate.value.completionTime)
})

const totalRuntimeFormatted = computed(() => {
  if (!sessionData.value) {
    return null
  }
  const totalSeconds = calculateTotalRuntime(sessionData.value)
  if (totalSeconds === null) {
    return null
  }
  return formatDuration(totalSeconds)
})

function calculateTimePerTask(index: number): number | null {
  if (!sessionData.value) {
    return null
  }
  return calcTimePerTask(sessionData.value.measurements, sessionData.value.startTime, index)
}

// Calculate tasks per minute for each measurement (for bar chart)
const tasksPerMinuteData = computed(() => {
  if (!sessionData.value) {
    return []
  }

  const data: number[] = []
  for (const [i, current] of sessionData.value.measurements.entries()) {
    if (!current) {
      data.push(0)
      continue
    }

    const previousTime =
      i === 0 ? sessionData.value.startTime : sessionData.value.measurements[i - 1]?.timestamp
    const previousTasks = i === 0 ? 0 : (sessionData.value.measurements[i - 1]?.completedTasks ?? 0)

    if (!previousTime) {
      data.push(0)
      continue
    }

    const timeDiffMs = current.timestamp.getTime() - previousTime.getTime()
    const taskDiff = current.completedTasks - previousTasks

    if (timeDiffMs <= 0 || taskDiff <= 0) {
      data.push(0)
      continue
    }

    const timeDiffMinutes = timeDiffMs / (1000 * 60)
    const tasksPerMinute = taskDiff / timeDiffMinutes
    data.push(tasksPerMinute)
  }

  return data
})

const maxTasksPerMinute = computed(() => {
  if (tasksPerMinuteData.value.length === 0) {
    return 1
  }
  return Math.max(...tasksPerMinuteData.value, 1)
})

function getBarWidth(index: number): number {
  const value = tasksPerMinuteData.value[index]
  if (!value || value <= 0) {
    return 0
  }
  return (value / maxTasksPerMinute.value) * 100
}
</script>

<template>
  <div
    class="q-pa-md"
    style="max-width: 600px; width: 100%; position: relative"
  >
    <!-- Reset Button - Top Right -->
    <div style="position: absolute; top: 16px; right: 16px">
      <q-btn
        icon="refresh"
        color="negative"
        outline
        round
        size="md"
        data-cy="btn-reset-session"
        @click="handleReset"
      >
        <q-tooltip>{{ TEXT_DE.shared.common.reset }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Progress Display -->
    <div class="text-center q-mb-lg">
      <div class="text-h3 text-weight-bold">
        {{ currentCompleted }} / {{ sessionData?.totalTasks }}
      </div>
      <q-linear-progress
        :value="progressPercentage / 100"
        size="20px"
        color="primary"
        class="q-mt-md"
      />

      <!-- Hourglass and Time Estimation Side by Side -->
      <div class="row items-center justify-center q-mt-md q-gutter-lg">
        <!-- Hourglass -->
        <div class="col-auto">
          <HourglassIcon
            :progress="progressPercentage"
            :size="100"
          />
        </div>

        <!-- Time Estimation -->
        <div
          v-if="timeEstimate"
          class="col-auto column q-gutter-sm"
        >
          <div class="row items-center q-gutter-xs">
            <q-icon
              name="timer"
              size="md"
              color="primary"
            />
            <span class="text-h6">{{ remainingTimeFormatted }}</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-icon
              name="hourglass_bottom"
              size="md"
              color="primary"
            />
            <span class="text-h6">{{ totalRuntimeFormatted }}</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-icon
              name="event"
              size="md"
              color="primary"
            />
            <span class="text-h6">{{ completionTimeFormatted }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Controls -->
    <div
      v-if="!store.isComplete()"
      class="row q-gutter-md q-mb-lg"
    >
      <q-input
        v-model.number="inputValue"
        :label="
          inputMode === 'completed'
            ? TEXT_DE.eta.tracking.inputPlaceholderCompleted
            : TEXT_DE.eta.tracking.inputPlaceholderRemaining
        "
        type="number"
        inputmode="numeric"
        filled
        class="col"
        :error="!isInputValid"
        hide-bottom-space
        data-cy="input-tasks"
        @keyup.enter="handleSubmit"
      >
        <template #prepend>
          <q-icon :name="inputIcon" />
        </template>
        <template #append>
          <q-btn
            flat
            dense
            icon="swap_horiz"
            data-cy="btn-toggle-mode"
            @click="toggleMode"
          />
        </template>
      </q-input>
      <q-btn
        icon="add"
        color="primary"
        size="lg"
        round
        class="col-auto"
        style="min-width: 60px; min-height: 60px"
        data-cy="btn-plus-one"
        @click="handlePlusOne"
      >
      </q-btn>
    </div>

    <!-- Measurement Table and Chart -->
    <div
      v-if="sessionData && sessionData.measurements.length > 0"
      class="q-mb-md"
    >
      <!-- Measurement Table -->
      <q-table
        :rows="[...sessionData.measurements].reverse()"
        :columns="[
          {
            name: 'tasks',
            label: '',
            field: 'completedTasks',
            align: 'center',
            headerStyle: 'width: 20%'
          },
          {
            name: 'speed',
            label: '',
            field: 'speed',
            align: 'center',
            headerStyle: 'width: 20%'
          },
          {
            name: 'bar',
            label: '',
            field: 'bar',
            align: 'left',
            headerStyle: 'width: 50%'
          },
          {
            name: 'actions',
            label: '',
            field: 'actions',
            align: 'right',
            headerStyle: 'width: 10%'
          }
        ]"
        row-key="timestamp"
        flat
        bordered
        dense
        hide-pagination
        :rows-per-page-options="[0]"
        class="q-mb-md"
        data-cy="measurement-table"
      >
        <template #header="props">
          <q-tr :props="props">
            <q-th
              key="tasks"
              :props="props"
            >
              <q-icon
                name="check_circle"
                size="sm"
              />
            </q-th>
            <q-th
              key="speed"
              :props="props"
            >
              <q-icon
                name="speed"
                size="sm"
              />
            </q-th>
            <q-th
              key="bar"
              :props="props"
            >
              <q-icon
                name="bar_chart"
                size="sm"
              />
            </q-th>
            <q-th
              key="actions"
              :props="props"
            />
          </q-tr>
        </template>
        <template #body-cell-speed="props">
          <q-td :props="props">
            <template v-if="calculateTimePerTask(sessionData.measurements.length - 1 - props.rowIndex) !== null">
              {{ calculateTimePerTask(sessionData.measurements.length - 1 - props.rowIndex) }} s
            </template>
            <template v-else> - </template>
          </q-td>
        </template>
        <template #body-cell-bar="props">
          <q-td :props="props">
            <q-linear-progress
              :value="getBarWidth(sessionData.measurements.length - 1 - props.rowIndex) / 100"
              size="20px"
              color="primary"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              :data-cy="`btn-delete-${sessionData.measurements.length - 1 - props.rowIndex}`"
              @click="store.deleteMeasurement(sessionData.measurements.length - 1 - props.rowIndex)"
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </div>
</template>
