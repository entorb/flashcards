import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GameShowCardQuestion from './GameShowCardQuestion.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

const currentCard = { level: 3, time: 12.5, answer: 'Antwort' }

describe('GameShowCardQuestion', () => {
  it('renders displayQuestion text', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: { currentCard, displayQuestion: 'Was ist 2+2?', showCorrectAnswer: false },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="question-display"]').text()).toContain('Was ist 2+2?')
  })

  it('renders card level badge', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: { currentCard, displayQuestion: 'Frage', showCorrectAnswer: false },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-level"]').exists()).toBe(true)
  })

  it('renders card time when time < MAX_TIME', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: {
        currentCard: { level: 2, time: 12.5, answer: 'x' },
        displayQuestion: 'Frage',
        showCorrectAnswer: false
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-time"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="card-time"]').text()).toContain('12.5s')
  })

  it('does not render card-time when time equals MAX_TIME', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: {
        currentCard: { level: 1, time: 60, answer: 'x' },
        displayQuestion: 'Frage',
        showCorrectAnswer: false
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-time"]').exists()).toBe(false)
  })

  it('shows correct answer when showCorrectAnswer=true', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: { currentCard, displayQuestion: 'Frage', showCorrectAnswer: true },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('Antwort')
  })

  it('does not show correct answer when showCorrectAnswer=false', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: {
        currentCard: { level: 1, time: 10, answer: 'GeheimAntwort' },
        displayQuestion: 'Frage',
        showCorrectAnswer: false
      },
      ...mountOptions
    })
    expect(wrapper.text()).not.toContain('GeheimAntwort')
  })

  it('does not render level/time badges when currentCard is null', () => {
    const wrapper = mount(GameShowCardQuestion, {
      props: { currentCard: null, displayQuestion: 'Frage', showCorrectAnswer: false },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-level"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="card-time"]').exists()).toBe(false)
  })
})
