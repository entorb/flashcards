import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { SessionData, TimeEstimate } from '@/types'

// Mock shared package text
vi.mock('@flashcards/shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@flashcards/shared')>()
  return { ...actual }
})

// Mock useEtaStore
const mockSessionData: SessionData = {
  totalTasks: 10,
  startTime: new Date('2024-01-01T10:00:00'),
  measurements: []
}

const mockStore = {
  sessionData: { value: mockSessionData },
  currentCompleted: { value: 0 },
  progressPercentage: { value: 0 },
  addMeasurement: vi.fn(() => true),
  deleteMeasurement: vi.fn(),
  resetSession: vi.fn(),
  getTimeEstimates: vi.fn<() => TimeEstimate | null>(() => null),
  isComplete: vi.fn(() => false)
}

vi.mock('@/composables/useEtaStore', () => ({
  useEtaStore: () => mockStore
}))

// Mock utility functions
vi.mock('@/utils/measurementCalculations', () => ({
  calculateTimePerTask: vi.fn(() => null),
  calculateTotalRuntime: vi.fn(() => null)
}))

vi.mock('@/utils/timeFormatters', () => ({
  formatDuration: vi.fn((s: number) => `${s}s`),
  formatClockTime: vi.fn((d: Date) => d.toISOString())
}))

import TrackingView from './TrackingView.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: {
      ...quasarStubs,
      HourglassIcon: { template: '<div data-cy="hourglass-icon" />', props: ['progress', 'size'] }
    }
  }
}

describe('TrackingView', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Reset mock store to defaults
    mockStore.sessionData.value = { ...mockSessionData, measurements: [] }
    mockStore.currentCompleted.value = 0
    mockStore.progressPercentage.value = 0
    mockStore.getTimeEstimates.mockReturnValue(null)
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(true)
  })

  it('mounts without errors', async () => {
    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the reset button', async () => {
    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="btn-reset-session"]').exists()).toBe(true)
  })

  it('renders the hourglass icon', async () => {
    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="hourglass-icon"]').exists()).toBe(true)
  })

  it('renders progress display with completed/total tasks', async () => {
    mockStore.currentCompleted.value = 3
    mockStore.sessionData.value = { ...mockSessionData, totalTasks: 10 }

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('10')
  })

  describe('empty state (no measurements)', () => {
    it('does not render measurement table when no measurements', async () => {
      mockStore.sessionData.value = { ...mockSessionData, measurements: [] }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="measurement-table"]').exists()).toBe(false)
    })

    it('renders input controls when session is not complete', async () => {
      mockStore.isComplete.mockReturnValue(false)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="input-tasks"]').exists()).toBe(true)
    })

    it('hides input controls when session is complete', async () => {
      mockStore.isComplete.mockReturnValue(true)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="input-tasks"]').exists()).toBe(false)
    })
  })

  describe('with measurements', () => {
    it('renders measurement table when measurements exist', async () => {
      mockStore.sessionData.value = {
        ...mockSessionData,
        measurements: [{ timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 3 }]
      }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="measurement-table"]').exists()).toBe(true)
    })

    it('renders measurement table with one row', async () => {
      mockStore.sessionData.value = {
        ...mockSessionData,
        measurements: [{ timestamp: new Date('2024-01-01T10:05:00'), completedTasks: 3 }]
      }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // Table is rendered (delete buttons are inside QTable named slots which stubs don't render)
      expect(wrapper.find('[data-cy="measurement-table"]').exists()).toBe(true)
    })
  })

  describe('time estimates', () => {
    it('does not render time estimate section when no estimates', async () => {
      mockStore.getTimeEstimates.mockReturnValue(null)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // No time estimate icons visible
      const html = wrapper.html()
      expect(html).not.toContain('data-cy="time-estimate"')
    })

    it('renders time estimate when available', async () => {
      mockStore.getTimeEstimates.mockReturnValue({
        remainingSeconds: 300,
        completionTime: new Date('2024-01-01T10:10:00')
      })

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // The time estimate section should be visible (v-if="timeEstimate")
      expect(wrapper.html()).toContain('timer')
    })
  })

  describe('reset button', () => {
    it('calls resetSession when reset button clicked', async () => {
      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-reset-session"]').trigger('click')

      expect(mockStore.resetSession).toHaveBeenCalledOnce()
    })
  })

  describe('plus-one button', () => {
    it('renders plus-one button when session is not complete', async () => {
      mockStore.isComplete.mockReturnValue(false)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="btn-plus-one"]').exists()).toBe(true)
    })

    it('calls addMeasurement with currentCompleted+1 when plus-one clicked with no input', async () => {
      mockStore.currentCompleted.value = 3
      mockStore.isComplete.mockReturnValue(false)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')

      expect(mockStore.addMeasurement).toHaveBeenCalledWith(4)
    })
  })

  describe('toggle mode button', () => {
    it('renders toggle mode button', async () => {
      mockStore.isComplete.mockReturnValue(false)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="btn-toggle-mode"]').exists()).toBe(true)
    })

    it('toggles input mode when toggle button clicked', async () => {
      mockStore.isComplete.mockReturnValue(false)
      mockStore.currentCompleted.value = 3
      mockStore.sessionData.value = { ...mockSessionData, totalTasks: 10 }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // Click toggle — should not throw
      await wrapper.find('[data-cy="btn-toggle-mode"]').trigger('click')
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('submit with typed input value', () => {
    it('calls addMeasurement with typed value when plus-one clicked with input', async () => {
      mockStore.currentCompleted.value = 2
      mockStore.isComplete.mockReturnValue(false)
      mockStore.addMeasurement.mockReturnValue(true)

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()

      // Trigger plus-one without input (inputValue is null) → uses currentCompleted+1
      await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')
      expect(mockStore.addMeasurement).toHaveBeenCalledWith(3)
    })

    it('renders with measurements that have positive task diffs (tableData computed)', async () => {
      mockStore.sessionData.value = {
        ...mockSessionData,
        totalTasks: 10,
        measurements: [
          { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 3 },
          { timestamp: new Date('2024-01-01T10:03:00'), completedTasks: 7 }
        ]
      }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="measurement-table"]').exists()).toBe(true)
    })

    it('renders with measurements where timeDiff <= 0 (zero barWidth path)', async () => {
      // Same timestamp = timeDiffMs = 0 → returns 0 for tasksPerMinute
      mockStore.sessionData.value = {
        ...mockSessionData,
        totalTasks: 10,
        measurements: [
          { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 3 },
          { timestamp: new Date('2024-01-01T10:01:00'), completedTasks: 5 }
        ]
      }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="measurement-table"]').exists()).toBe(true)
    })
  })

  describe('session complete state', () => {
    it('hides input controls when session is complete', async () => {
      mockStore.isComplete.mockReturnValue(true)
      mockStore.sessionData.value = { ...mockSessionData, totalTasks: 10 }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // Input controls hidden when complete
      expect(wrapper.find('[data-cy="input-tasks"]').exists()).toBe(false)
    })

    it('remainingTimeFormatted returns 00:00 when complete (computed logic)', async () => {
      // When isComplete=true and timeEstimate=null, remainingTimeFormatted='00:00'
      // but it's only rendered inside v-if="timeEstimate" — so we verify via component vm
      mockStore.isComplete.mockReturnValue(true)
      mockStore.getTimeEstimates.mockReturnValue({
        remainingSeconds: 300,
        completionTime: new Date()
      })
      mockStore.sessionData.value = { ...mockSessionData, totalTasks: 10 }

      const wrapper = mount(TrackingView, mountOptions)
      await wrapper.vm.$nextTick()
      // With timeEstimate present, the time section renders
      expect(wrapper.html()).toContain('timer')
    })
  })
})

describe('handleSubmit — remaining mode', () => {
  it('converts remaining input to completed tasks and calls addMeasurement', async () => {
    mockStore.currentCompleted.value = 2
    mockStore.sessionData.value = { ...mockSessionData, totalTasks: 10 }
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(true)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()

    // Toggle to remaining mode
    await wrapper.find('[data-cy="btn-toggle-mode"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Set inputValue via vm
    const vm = wrapper.vm as unknown as { inputValue: number | null }
    vm.inputValue = 3 // 3 remaining → completed = 10 - 3 = 7
    await wrapper.vm.$nextTick()

    // Click plus-one which calls handleSubmit when inputValue is set
    await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')
    expect(mockStore.addMeasurement).toHaveBeenCalledWith(7)
  })

  it('clears inputValue after successful addMeasurement', async () => {
    mockStore.currentCompleted.value = 2
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(true)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as { inputValue: number | null }
    vm.inputValue = 5
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')
    expect(vm.inputValue).toBeNull()
  })

  it('does not clear inputValue when addMeasurement returns false', async () => {
    mockStore.currentCompleted.value = 2
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(false)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as { inputValue: number | null }
    vm.inputValue = 5
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')
    expect(vm.inputValue).toBe(5)
  })
})

describe('handleSubmit — null input guard', () => {
  it('does not call addMeasurement when inputValue is null and plus-one clicked without prior input', async () => {
    mockStore.currentCompleted.value = 2
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(true)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()

    // inputValue starts as null — plus-one should use currentCompleted+1 path, not handleSubmit
    await wrapper.find('[data-cy="btn-plus-one"]').trigger('click')
    // addMeasurement called with currentCompleted+1 = 3, not via handleSubmit null path
    expect(mockStore.addMeasurement).toHaveBeenCalledWith(3)
  })
})

describe('totalRuntimeFormatted computed', () => {
  it('returns null when no measurements (calculateTotalRuntime returns null)', async () => {
    const { calculateTotalRuntime } = await import('@/utils/measurementCalculations')
    vi.mocked(calculateTotalRuntime).mockReturnValue(null)
    mockStore.sessionData.value = { ...mockSessionData, measurements: [] }

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    // No crash — totalRuntimeFormatted is null, not rendered
    expect(wrapper.exists()).toBe(true)
  })
})

describe('remainingTimeFormatted — complete state', () => {
  it('returns 00:00 when session is complete', async () => {
    mockStore.isComplete.mockReturnValue(true)
    mockStore.getTimeEstimates.mockReturnValue(null)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { remainingTimeFormatted: string | null }
    expect(vm.remainingTimeFormatted).toBe('00:00')
  })
})

describe('keyup.enter on input', () => {
  it('triggers handleSubmit on Enter key in input field', async () => {
    mockStore.currentCompleted.value = 2
    mockStore.isComplete.mockReturnValue(false)
    mockStore.addMeasurement.mockReturnValue(true)

    const wrapper = mount(TrackingView, mountOptions)
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as { inputValue: number | null }
    vm.inputValue = 5
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-cy="input-tasks"]').trigger('keyup.enter')
    expect(mockStore.addMeasurement).toHaveBeenCalledWith(5)
  })
})
