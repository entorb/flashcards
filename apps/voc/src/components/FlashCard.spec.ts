import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FlashCard from './FlashCard.vue'

import { quasarStubs } from '@/__tests__/testUtils'
import type { Card, GameSettings } from '@/types'

describe('FlashCard Component', () => {
  const mockCard: Card = {
    en: 'hello',
    de: 'hallo',
    level: 3,
    time_blind: 5.0,
    time_typing: 10.0
  }

  const mockSettings: GameSettings = {
    mode: 'multiple-choice',
    focus: 'weak',
    language: 'en-de'
  }

  const mockAllCards: Card[] = [
    mockCard,
    { en: 'goodbye', de: 'auf Wiedersehen', level: 2, time_blind: 8.0, time_typing: 12.0 },
    { en: 'thank you', de: 'danke', level: 1, time_blind: 3.0, time_typing: 6.0 },
    { en: 'please', de: 'bitte', level: 4, time_blind: 4.0, time_typing: 7.0 }
  ]

  const mountOptions = {
    global: {
      stubs: quasarStubs
    }
  }

  it('mounts without errors', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: mockSettings
      },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders question display', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: mockSettings
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="game-page-question"]').exists()).toBe(true)
  })

  it('computes question correctly for en-de direction', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, language: 'en-de' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { question: string }
    expect(vm.question).toBe('hello')
  })

  it('computes question correctly for de-en direction', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, language: 'de-en' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { question: string }
    expect(vm.question).toBe('hallo')
  })

  it('computes correctAnswer for en-de direction', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, language: 'en-de' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { correctAnswer: string }
    expect(vm.correctAnswer).toBe('hallo')
  })

  it('computes correctAnswer for de-en direction', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, language: 'de-en' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { correctAnswer: string }
    expect(vm.correctAnswer).toBe('hello')
  })

  it('computes targetLang correctly', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, language: 'en-de' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { targetLang: string }
    expect(vm.targetLang).toBe('de')
  })

  it('renders multiple-choice options for MC mode', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, mode: 'multiple-choice' }
      },
      ...mountOptions
    })
    const options = wrapper.findAll('[data-cy="multiple-choice-option"]')
    expect(options).toHaveLength(4)
  })

  it('renders reveal button for blind mode', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, mode: 'blind' }
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="reveal-answer-button"]').exists()).toBe(true)
  })

  it('renders typing input for typing mode', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: mockCard,
        allCards: mockAllCards,
        settings: { ...mockSettings, mode: 'typing' }
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="typing-input"]').exists()).toBe(true)
  })

  it('displays time for blind mode when below MAX_TIME', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: { ...mockCard, time_blind: 5.0 },
        allCards: mockAllCards,
        settings: { ...mockSettings, mode: 'blind' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { displayTime: number }
    expect(vm.displayTime).toBe(5.0)
  })

  it('displays time for typing mode when below MAX_TIME', () => {
    const wrapper = mount(FlashCard, {
      props: {
        card: { ...mockCard, time_typing: 10.0 },
        allCards: mockAllCards,
        settings: { ...mockSettings, mode: 'typing' }
      },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { displayTime: number }
    expect(vm.displayTime).toBe(10.0)
  })
})
