import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'
import { vi } from 'vitest'
import { useGameTimer } from './useGameTimer'

// Helper: mount useGameTimer inside a minimal component so Vue lifecycle hooks work
function mountTimer(initialTrigger: unknown = 'card-1', maxTime?: number) {
  const trigger = ref(initialTrigger)
  let exposed: ReturnType<typeof useGameTimer> | undefined

  const TestComponent = defineComponent({
    setup() {
      const timer = useGameTimer(trigger, maxTime)
      exposed = timer
      return timer
    },
    template: '<div />'
  })

  const wrapper = mount(TestComponent)
  return {
    wrapper,
    trigger,
    get timer() {
      return exposed!
    }
  }
}

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts immediately — elapsedTime is 0 before any tick', () => {
    const { timer } = mountTimer()
    expect(timer.elapsedTime.value).toBe(0)
  })

  it('increments elapsedTime by 0.1 every 100ms', () => {
    const { timer } = mountTimer()
    vi.advanceTimersByTime(300)
    expect(timer.elapsedTime.value).toBeCloseTo(0.3, 5)
  })

  it('accumulates over multiple ticks', () => {
    const { timer } = mountTimer()
    vi.advanceTimersByTime(1000)
    expect(timer.elapsedTime.value).toBeCloseTo(1.0, 5)
  })

  it('stopTimer halts the interval', () => {
    const { timer } = mountTimer()
    vi.advanceTimersByTime(200)
    timer.stopTimer()
    const snapshot = timer.elapsedTime.value
    vi.advanceTimersByTime(500)
    expect(timer.elapsedTime.value).toBe(snapshot)
  })

  it('resets elapsedTime to 0 when trigger ref changes', async () => {
    const { timer, trigger, wrapper } = mountTimer()
    vi.advanceTimersByTime(500)
    expect(timer.elapsedTime.value).toBeCloseTo(0.5, 5)

    trigger.value = 'card-2'
    await wrapper.vm.$nextTick()

    expect(timer.elapsedTime.value).toBe(0)
  })

  it('resumes counting after trigger change', async () => {
    const { timer, trigger, wrapper } = mountTimer()
    vi.advanceTimersByTime(300)
    trigger.value = 'card-2'
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(200)
    expect(timer.elapsedTime.value).toBeCloseTo(0.2, 5)
  })

  it('caps elapsedTime at maxTime', () => {
    const { timer } = mountTimer('card-1', 1)
    vi.advanceTimersByTime(2000)
    expect(timer.elapsedTime.value).toBe(1)
  })

  it('stops incrementing after unmount', () => {
    const { timer, wrapper } = mountTimer()
    vi.advanceTimersByTime(200)
    wrapper.unmount()
    const snapshot = timer.elapsedTime.value
    vi.advanceTimersByTime(500)
    expect(timer.elapsedTime.value).toBe(snapshot)
  })
})
