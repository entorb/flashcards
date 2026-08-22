import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomeLevelSelector from './HomeLevelSelector.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

function makeCards(levels: number[]): { level: number; time: number }[] {
  return levels.map(level => ({ level, time: 60 }))
}

describe('HomeLevelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 5 level buttons', () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [1, 2, 3, 4, 5], cards: [] },
      ...mountOptions
    })
    expect(wrapper.findAll('button')).toHaveLength(5)
  })

  it('shows card counts per level like "L1 (12)"', () => {
    const wrapper = mount(HomeLevelSelector, {
      props: {
        modelValue: [1, 2, 3, 4, 5],
        cards: makeCards([1, 1, 1, 3])
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="level-button-1"]').text()).toContain('L1 (3)')
    expect(wrapper.find('[data-cy="level-button-2"]').text()).toContain('L2 (0)')
    expect(wrapper.find('[data-cy="level-button-3"]').text()).toContain('L3 (1)')
  })

  it('clicking an unselected level adds it sorted', async () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [2], cards: [] },
      ...mountOptions
    })
    await wrapper.find('[data-cy="level-button-1"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 2]]])
  })

  it('deselecting one of several levels removes it', async () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [1, 3], cards: [] },
      ...mountOptions
    })
    await wrapper.find('[data-cy="level-button-3"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[1]]])
  })

  it('deselecting the only selected level selects all', async () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [4], cards: [] },
      ...mountOptions
    })
    await wrapper.find('[data-cy="level-button-4"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 2, 3, 4, 5]]])
  })

  it('clicking a level when all are selected selects only that level', async () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [1, 2, 3, 4, 5], cards: [] },
      ...mountOptions
    })
    await wrapper.find('[data-cy="level-button-3"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[3]]])
  })

  it('shows the section label by default', () => {
    const wrapper = mount(HomeLevelSelector, {
      props: { modelValue: [1, 2, 3, 4, 5], cards: [] },
      ...mountOptions
    })
    expect(wrapper.find('.text-subtitle2').exists()).toBe(true)
  })
})
