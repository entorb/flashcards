import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnswerFeedback } from './useAnswerFeedback'

describe('useAnswerFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('showFeedback is false', () => {
      const { showFeedback } = useAnswerFeedback()
      expect(showFeedback.value).toBe(false)
    })

    it('answerStatus is null', () => {
      const { answerStatus } = useAnswerFeedback()
      expect(answerStatus.value).toBeNull()
    })

    it('isButtonDisabled is false', () => {
      const { isButtonDisabled } = useAnswerFeedback()
      expect(isButtonDisabled.value).toBe(false)
    })

    it('feedbackCountdown is 0', () => {
      const { feedbackCountdown } = useAnswerFeedback()
      expect(feedbackCountdown.value).toBe(0)
    })

    it('buttonDisableCountdown is 0', () => {
      const { buttonDisableCountdown } = useAnswerFeedback()
      expect(buttonDisableCountdown.value).toBe(0)
    })
  })

  describe('startAutoClose', () => {
    it('sets feedbackCountdown to duration in seconds', () => {
      const { feedbackCountdown, startAutoClose } = useAnswerFeedback({ autoCloseDuration: 3000 })
      startAutoClose(vi.fn())
      expect(feedbackCountdown.value).toBe(3)
    })

    it('calls callback after autoCloseDuration', () => {
      const onAutoClose = vi.fn()
      const { startAutoClose } = useAnswerFeedback({ autoCloseDuration: 2000 })
      startAutoClose(onAutoClose)
      expect(onAutoClose).not.toHaveBeenCalled()
      vi.advanceTimersByTime(2000)
      expect(onAutoClose).toHaveBeenCalledOnce()
    })

    it('does not call callback before duration elapses', () => {
      const onAutoClose = vi.fn()
      const { startAutoClose } = useAnswerFeedback({ autoCloseDuration: 3000 })
      startAutoClose(onAutoClose)
      vi.advanceTimersByTime(2999)
      expect(onAutoClose).not.toHaveBeenCalled()
    })

    it('decrements feedbackCountdown over time', () => {
      const { feedbackCountdown, startAutoClose } = useAnswerFeedback({
        autoCloseDuration: 3000,
        countdownInterval: 100
      })
      startAutoClose(vi.fn())
      expect(feedbackCountdown.value).toBe(3)
      vi.advanceTimersByTime(1000)
      expect(feedbackCountdown.value).toBeCloseTo(2, 0)
    })

    it('resets feedbackCountdown to 0 after callback fires', () => {
      const { feedbackCountdown, startAutoClose } = useAnswerFeedback({ autoCloseDuration: 1000 })
      startAutoClose(vi.fn())
      vi.advanceTimersByTime(1000)
      expect(feedbackCountdown.value).toBe(0)
    })
  })

  describe('startButtonDisable', () => {
    it('sets isButtonDisabled to true immediately', () => {
      const { isButtonDisabled, startButtonDisable } = useAnswerFeedback({
        buttonDisableDuration: 3000
      })
      startButtonDisable(vi.fn())
      expect(isButtonDisabled.value).toBe(true)
    })

    it('sets buttonDisableCountdown to duration in seconds', () => {
      const { buttonDisableCountdown, startButtonDisable } = useAnswerFeedback({
        buttonDisableDuration: 3000
      })
      startButtonDisable(vi.fn())
      expect(buttonDisableCountdown.value).toBe(3)
    })

    it('re-enables button after buttonDisableDuration', () => {
      const { isButtonDisabled, startButtonDisable } = useAnswerFeedback({
        buttonDisableDuration: 2000
      })
      startButtonDisable(vi.fn())
      expect(isButtonDisabled.value).toBe(true)
      vi.advanceTimersByTime(2000)
      expect(isButtonDisabled.value).toBe(false)
    })

    it('calls onButtonEnable callback after duration', () => {
      const onButtonEnable = vi.fn()
      const { startButtonDisable } = useAnswerFeedback({ buttonDisableDuration: 1500 })
      startButtonDisable(onButtonEnable)
      expect(onButtonEnable).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1500)
      expect(onButtonEnable).toHaveBeenCalledOnce()
    })

    it('does not re-enable button before duration elapses', () => {
      const { isButtonDisabled, startButtonDisable } = useAnswerFeedback({
        buttonDisableDuration: 3000
      })
      startButtonDisable(vi.fn())
      vi.advanceTimersByTime(2999)
      expect(isButtonDisabled.value).toBe(true)
    })
  })

  describe('reset', () => {
    it('sets showFeedback to false', () => {
      const { showFeedback, reset } = useAnswerFeedback()
      showFeedback.value = true
      reset()
      expect(showFeedback.value).toBe(false)
    })

    it('sets answerStatus to null', () => {
      const { answerStatus, reset } = useAnswerFeedback()
      answerStatus.value = 'correct'
      reset()
      expect(answerStatus.value).toBeNull()
    })

    it('sets isButtonDisabled to false', () => {
      const { isButtonDisabled, startButtonDisable, reset } = useAnswerFeedback({
        buttonDisableDuration: 5000
      })
      startButtonDisable(vi.fn())
      expect(isButtonDisabled.value).toBe(true)
      reset()
      expect(isButtonDisabled.value).toBe(false)
    })

    it('cancels pending autoClose timer', () => {
      const onAutoClose = vi.fn()
      const { startAutoClose, reset } = useAnswerFeedback({ autoCloseDuration: 2000 })
      startAutoClose(onAutoClose)
      reset()
      vi.advanceTimersByTime(2000)
      expect(onAutoClose).not.toHaveBeenCalled()
    })

    it('cancels pending buttonDisable timer', () => {
      const onButtonEnable = vi.fn()
      const { startButtonDisable, reset } = useAnswerFeedback({ buttonDisableDuration: 2000 })
      startButtonDisable(onButtonEnable)
      reset()
      vi.advanceTimersByTime(2000)
      expect(onButtonEnable).not.toHaveBeenCalled()
    })

    it('resets feedbackCountdown to 0', () => {
      const { feedbackCountdown, startAutoClose, reset } = useAnswerFeedback({
        autoCloseDuration: 3000
      })
      startAutoClose(vi.fn())
      expect(feedbackCountdown.value).toBe(3)
      reset()
      expect(feedbackCountdown.value).toBe(0)
    })

    it('resets buttonDisableCountdown to 0', () => {
      const { buttonDisableCountdown, startButtonDisable, reset } = useAnswerFeedback({
        buttonDisableDuration: 3000
      })
      startButtonDisable(vi.fn())
      expect(buttonDisableCountdown.value).toBe(3)
      reset()
      expect(buttonDisableCountdown.value).toBe(0)
    })
  })

  describe('clearTimers', () => {
    it('cancels pending autoClose timer without changing showFeedback', () => {
      const onAutoClose = vi.fn()
      const { showFeedback, startAutoClose, clearTimers } = useAnswerFeedback({
        autoCloseDuration: 2000
      })
      showFeedback.value = true
      startAutoClose(onAutoClose)
      clearTimers()
      vi.advanceTimersByTime(2000)
      expect(onAutoClose).not.toHaveBeenCalled()
      expect(showFeedback.value).toBe(true)
    })

    it('cancels pending buttonDisable timer without changing isButtonDisabled', () => {
      const onButtonEnable = vi.fn()
      const { isButtonDisabled, startButtonDisable, clearTimers } = useAnswerFeedback({
        buttonDisableDuration: 2000
      })
      startButtonDisable(onButtonEnable)
      clearTimers()
      vi.advanceTimersByTime(2000)
      expect(onButtonEnable).not.toHaveBeenCalled()
      // isButtonDisabled was set to true by startButtonDisable; clearTimers does not reset it
      expect(isButtonDisabled.value).toBe(true)
    })

    it('resets feedbackCountdown to 0', () => {
      const { feedbackCountdown, startAutoClose, clearTimers } = useAnswerFeedback({
        autoCloseDuration: 3000
      })
      startAutoClose(vi.fn())
      expect(feedbackCountdown.value).toBe(3)
      clearTimers()
      expect(feedbackCountdown.value).toBe(0)
    })

    it('resets buttonDisableCountdown to 0', () => {
      const { buttonDisableCountdown, startButtonDisable, clearTimers } = useAnswerFeedback({
        buttonDisableDuration: 3000
      })
      startButtonDisable(vi.fn())
      expect(buttonDisableCountdown.value).toBe(3)
      clearTimers()
      expect(buttonDisableCountdown.value).toBe(0)
    })

    it('does not change answerStatus', () => {
      const { answerStatus, clearTimers } = useAnswerFeedback()
      answerStatus.value = 'incorrect'
      clearTimers()
      expect(answerStatus.value).toBe('incorrect')
    })
  })
})
