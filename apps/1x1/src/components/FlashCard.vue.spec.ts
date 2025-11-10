import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FlashCard from './FlashCard.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import type { Card, SelectionType } from '@/types'
import { formatDisplayQuestion } from '@/utils/questionFormatter'

describe('FlashCard Component', () => {
  const mockCard: Card = {
    question: '6x7',
    answer: 42,
    level: 3,
    time: 5.0
  }

  const mountOptions = {
    global: {
      mocks: quasarMocks,
      provide: quasarProvide,
      stubs: quasarStubs
    }
  }

  it('mounts without errors', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        elapsedTime: 0
      },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders question display', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        elapsedTime: 0
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="question-display"]').exists()).toBe(true)
  })

  it('renders answer input', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        elapsedTime: 0
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
  })

  it('displays card level badge', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        elapsedTime: 0
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-level"]').exists()).toBe(true)
  })

  it('displays card time when below MAX_CARD_TIME', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: { ...mockCard, time: 5.0 },
        elapsedTime: 0
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-time"]').exists()).toBe(true)
  })

  it('computes expectedAnswerLength correctly for single digit', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: { question: '3x3', answer: 9, level: 1, time: 60 },
        elapsedTime: 0
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { expectedAnswerLength: number }
    expect(vm.expectedAnswerLength).toBe(1)
  })

  it('computes expectedAnswerLength correctly for two digits', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        elapsedTime: 0
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { expectedAnswerLength: number }
    expect(vm.expectedAnswerLength).toBe(2)
  })

  it('computes expectedAnswerLength correctly for three digits', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: { question: '12x15', answer: 180, level: 1, time: 60 },
        elapsedTime: 0
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { expectedAnswerLength: number }
    expect(vm.expectedAnswerLength).toBe(3)
  })
})

describe('FlashCard - displayQuestion logic', () => {
  it('should reorder question when single number [3] is selected and matches first operand', () => {
    const question = '3x16'
    const selection: SelectionType = [3]

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('16×3')
  })

  it('should reorder question when single number [3] is selected and matches second operand', () => {
    const question = '5x3'
    const selection: SelectionType = [3]

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('5×3')
  })

  it('should not reorder when single number [3] is selected but does not match', () => {
    const question = '5x8'
    const selection: SelectionType = [3]

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('5×8')
  })

  it('should use default format when multiple numbers are selected', () => {
    const question = '3x16'
    const selection: SelectionType = [3, 4, 5]

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('3×16')
  })

  it('should use default format when x² is selected', () => {
    const question = '3x16'
    const selection: SelectionType = 'x²'

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('3×16')
  })

  it('should use default format when selection is undefined', () => {
    const question = '3x16'
    const selection: SelectionType | undefined = undefined

    const result = formatDisplayQuestion(question, selection)
    expect(result).toBe('3×16')
  })
})
