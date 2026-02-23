import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import { useCountdownTimer } from './useCountdownTimer'

/**
 * Mount a minimal component that calls the composable so that lifecycle hooks
 * (onUnmounted) are properly registered and triggered on unmount.
 */
function withSetup<T>(setup: () => T): { result: T; unmount: () => void } {
  let result!: T
  const TestComponent = defineComponent({
    setup() {
      result = setup()
      return () => h('div')
    }
  })
  const wrapper = mount(TestComponent)
  return {
    result,
    unmount: () => {
      wrapper.unmount()
    }
  }
}

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('countdown starts at 0', () => {
      const { countdown } = useCountdownTimer()
      expect(countdown.value).toBe(0)
    })

    it('isRunning starts as false', () => {
      const { isRunning } = useCountdownTimer()
      expect(isRunning.value).toBe(false)
    })
  })

  describe('start', () => {
    it('sets countdown to the given duration', () => {
      const { countdown, start } = useCountdownTimer({ tickInterval: 100 })
      start(3)
      expect(countdown.value).toBe(3)
    })

    it('sets isRunning to true', () => {
      const { isRunning, start } = useCountdownTimer({ tickInterval: 100 })
      start(3)
      expect(isRunning.value).toBe(true)
    })

    it('decreases countdown after 1 second', () => {
      const { countdown, start } = useCountdownTimer({ tickInterval: 100 })
      start(3)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBeCloseTo(2, 0)
    })

    it('reaches 0 after full duration', () => {
      const { countdown, start } = useCountdownTimer({ tickInterval: 100 })
      start(3)
      vi.advanceTimersByTime(3000)
      expect(countdown.value).toBe(0)
    })

    it('sets isRunning to false when countdown reaches 0', () => {
      const { isRunning, start } = useCountdownTimer({ tickInterval: 100 })
      start(3)
      vi.advanceTimersByTime(3000)
      expect(isRunning.value).toBe(false)
    })

    it('calls the callback when countdown reaches 0', () => {
      const onComplete = vi.fn()
      const { start } = useCountdownTimer({ tickInterval: 100 })
      start(3, onComplete)
      expect(onComplete).not.toHaveBeenCalled()
      vi.advanceTimersByTime(3000)
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('does not call callback before duration elapses', () => {
      const onComplete = vi.fn()
      const { start } = useCountdownTimer({ tickInterval: 100 })
      start(3, onComplete)
      vi.advanceTimersByTime(2900)
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('works without a callback', () => {
      const { countdown, isRunning, start } = useCountdownTimer({ tickInterval: 100 })
      start(2)
      vi.advanceTimersByTime(2000)
      expect(countdown.value).toBe(0)
      expect(isRunning.value).toBe(false)
    })

    it('restarts when called again mid-countdown', () => {
      const { countdown, start } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      vi.advanceTimersByTime(2000)
      start(3)
      expect(countdown.value).toBe(3)
      vi.advanceTimersByTime(3000)
      expect(countdown.value).toBe(0)
    })
  })

  describe('stop', () => {
    it('halts the countdown mid-way', () => {
      const { countdown, start, stop } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      vi.advanceTimersByTime(2000)
      const valueAtStop = countdown.value
      stop()
      vi.advanceTimersByTime(3000)
      expect(countdown.value).toBe(valueAtStop)
    })

    it('sets isRunning to false', () => {
      const { isRunning, start, stop } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      stop()
      expect(isRunning.value).toBe(false)
    })

    it('prevents callback from firing after stop', () => {
      const onComplete = vi.fn()
      const { start, stop } = useCountdownTimer({ tickInterval: 100 })
      start(3, onComplete)
      vi.advanceTimersByTime(1000)
      stop()
      vi.advanceTimersByTime(3000)
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('is safe to call when not running', () => {
      const { stop } = useCountdownTimer()
      expect(() => {
        stop()
      }).not.toThrow()
    })
  })

  describe('reset', () => {
    it('sets countdown to 0', () => {
      const { countdown, start, reset } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      vi.advanceTimersByTime(2000)
      reset()
      expect(countdown.value).toBe(0)
    })

    it('sets isRunning to false', () => {
      const { isRunning, start, reset } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      reset()
      expect(isRunning.value).toBe(false)
    })

    it('halts the interval so countdown stays at 0', () => {
      const { countdown, start, reset } = useCountdownTimer({ tickInterval: 100 })
      start(5)
      reset()
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(0)
    })

    it('prevents callback from firing after reset', () => {
      const onComplete = vi.fn()
      const { start, reset } = useCountdownTimer({ tickInterval: 100 })
      start(3, onComplete)
      vi.advanceTimersByTime(1000)
      reset()
      vi.advanceTimersByTime(3000)
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('cleanup on unmount', () => {
    it('stops the interval when the component is unmounted', () => {
      const { result, unmount } = withSetup(() => useCountdownTimer({ tickInterval: 100 }))
      const onComplete = vi.fn()
      result.start(3, onComplete)
      vi.advanceTimersByTime(1000)
      unmount()
      vi.advanceTimersByTime(3000)
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('sets isRunning to false after unmount', () => {
      const { result, unmount } = withSetup(() => useCountdownTimer({ tickInterval: 100 }))
      result.start(5)
      unmount()
      expect(result.isRunning.value).toBe(false)
    })
  })
})
