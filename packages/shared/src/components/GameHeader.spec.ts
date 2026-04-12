import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameHeader from './GameHeader.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('GameHeader', () => {
  it('renders currentIndex + 1 / totalCards in card-counter', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 2, totalCards: 10, points: 42 },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('3 / 10')
  })

  it('renders points value', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 0, totalCards: 5, points: 99 },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('99')
  })

  it('emits back when back button is clicked', async () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 0, totalCards: 5, points: 0 },
      ...mountOptions
    })
    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('shows index 1 when currentIndex is 0', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 0, totalCards: 3, points: 0 },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('1 / 3')
  })
})

// Feature: game-modes-endless-and-loops, Property 5: GameHeader totalCardsOverride replaces default total
// **Validates: Requirements 3.5, 6.5**
describe('GameHeader — totalCardsOverride', () => {
  it('shows only totalCardsOverride when provided', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 3, totalCards: 10, points: 50, totalCardsOverride: 7 },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-counter"]').text().trim()).toBe('7')
  })

  it('shows index / totalCards when totalCardsOverride is not provided', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 3, totalCards: 10, points: 50 },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('4 / 10')
  })

  it('works with edge values (index 0, large override)', () => {
    const wrapper = mount(GameHeader, {
      props: { currentIndex: 0, totalCards: 999, points: 0, totalCardsOverride: 500 },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="card-counter"]').text().trim()).toBe('500')
  })
})
