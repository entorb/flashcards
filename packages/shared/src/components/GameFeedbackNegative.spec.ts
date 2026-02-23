import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GameFeedbackNegative from './GameFeedbackNegative.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('GameFeedbackNegative', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user answer and correct answer', () => {
    const wrapper = mount(GameFeedbackNegative, {
      props: { status: 'incorrect', userAnswer: 'falsch', correctAnswer: 'richtig' },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('falsch')
    expect(wrapper.text()).toContain('richtig')
  })

  it('applies warning style for status="close"', () => {
    const wrapper = mount(GameFeedbackNegative, {
      props: { status: 'close', userAnswer: 'fast', correctAnswer: 'genau' },
      ...mountOptions
    })
    const userSpan = wrapper.find('span.text-warning')
    expect(userSpan.exists()).toBe(true)
    expect(userSpan.text()).toBe('fast')
  })

  it('applies negative style for status="incorrect"', () => {
    const wrapper = mount(GameFeedbackNegative, {
      props: { status: 'incorrect', userAnswer: 'falsch', correctAnswer: 'richtig' },
      ...mountOptions
    })
    const userSpan = wrapper.find('span.text-negative')
    expect(userSpan.exists()).toBe(true)
    expect(userSpan.text()).toBe('falsch')
  })

  it('correct answer is rendered with positive style', () => {
    const wrapper = mount(GameFeedbackNegative, {
      props: { status: 'incorrect', userAnswer: 'falsch', correctAnswer: 'richtig' },
      ...mountOptions
    })
    const correctSpan = wrapper.find('span.text-positive')
    expect(correctSpan.exists()).toBe(true)
    expect(correctSpan.text()).toBe('richtig')
  })

  it('renders data-cy="wrong-answer-feedback"', () => {
    const wrapper = mount(GameFeedbackNegative, {
      props: { status: 'incorrect', userAnswer: 'x', correctAnswer: 'y' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="wrong-answer-feedback"]').exists()).toBe(true)
  })
})
