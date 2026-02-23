import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GameAnswerFeedback from './GameAnswerFeedback.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('GameAnswerFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correct icon for status="correct"', () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'correct' },
      ...mountOptions
    })
    // QIcon is stubbed as <i />, check via data-cy on the card
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(true)
  })

  it('renders wrong-answer data-cy for status="incorrect"', () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'incorrect' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="wrong-answer-feedback"]').exists()).toBe(true)
  })

  it('renders no specific data-cy for status="close"', () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'close' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="wrong-answer-feedback"]').exists()).toBe(false)
  })

  it('emits continue when continue button is clicked', async () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'correct' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="continue-button"]').trigger('click')
    expect(wrapper.emitted('continue')).toHaveLength(1)
  })

  it('continue button is present and isButtonDisabled prop is true', () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'correct', isButtonDisabled: true },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="continue-button"]').exists()).toBe(true)
    // Verify the prop was received correctly by the component
    expect(wrapper.props('isButtonDisabled')).toBe(true)
  })

  it('continue button is not rendered when showContinueButton=false', () => {
    const wrapper = mount(GameAnswerFeedback, {
      props: { status: 'correct', showContinueButton: false },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="continue-button"]').exists()).toBe(false)
  })
})
