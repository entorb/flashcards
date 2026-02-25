import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
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
describe('GameHeader — totalCardsOverride property test', () => {
  it('shows totalCardsOverride when provided, totalCards when not', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 1, max: 999 }),
        fc.integer({ min: 0, max: 9999 }),
        (currentIndex, totalCards, points) => {
          // Generate a totalCardsOverride that differs from totalCards
          const totalCardsOverride = totalCards + 1

          // With totalCardsOverride — display must show only the override value (remaining count)
          const withOverride = mount(GameHeader, {
            props: { currentIndex, totalCards, points, totalCardsOverride },
            ...mountOptions
          })
          const counterWith = withOverride.find('[data-cy="card-counter"]').text().trim()
          expect(counterWith).toBe(String(totalCardsOverride))

          // Without totalCardsOverride — display must use totalCards
          const withoutOverride = mount(GameHeader, {
            props: { currentIndex, totalCards, points },
            ...mountOptions
          })
          const counterWithout = withoutOverride.find('[data-cy="card-counter"]').text()
          expect(counterWithout).toContain(`${currentIndex + 1} / ${totalCards}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})
