import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BUTTON_DISABLE_DURATION } from '../constants'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GameNextCardButton from './GameNextCardButton.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('GameNextCardButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders continue-button data-cy element', () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'correct' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="continue-button"]').exists()).toBe(true)
  })

  it('emits click when button is clicked for correct answer', async () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'correct' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="continue-button"]').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('emits disabledChange(true) on mount for incorrect answer', () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'incorrect' },
      ...mountOptions
    })
    const emitted = wrapper.emitted('disabledChange')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([true])
  })

  it('emits disabledChange(true) on mount for close answer', () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'close' },
      ...mountOptions
    })
    const emitted = wrapper.emitted('disabledChange')
    expect(emitted?.[0]).toEqual([true])
  })

  it('does not emit disabledChange on mount for correct answer', () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'correct' },
      ...mountOptions
    })
    expect(wrapper.emitted('disabledChange')).toBeFalsy()
  })

  it('emits disabledChange(false) after BUTTON_DISABLE_DURATION for incorrect', async () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'incorrect' },
      ...mountOptions
    })
    vi.advanceTimersByTime(BUTTON_DISABLE_DURATION)
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('disabledChange')
    expect(emitted?.[emitted.length - 1]).toEqual([false])
  })

  it('emits disabledChange(false) on unmount while disabled', () => {
    const wrapper = mount(GameNextCardButton, {
      props: { answerStatus: 'incorrect' },
      ...mountOptions
    })
    wrapper.unmount()
    const emitted = wrapper.emitted('disabledChange')
    const lastEmit = emitted?.[emitted.length - 1]
    expect(lastEmit).toEqual([false])
  })
})
