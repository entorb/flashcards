import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HomeFocusSelector from './HomeFocusSelector.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('HomeFocusSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 4 focus option buttons', () => {
    const wrapper = mount(HomeFocusSelector, {
      props: { modelValue: 'medium' },
      ...mountOptions
    })
    expect(wrapper.findAll('button')).toHaveLength(4)
  })

  it('clicking a button updates the model value', async () => {
    const wrapper = mount(HomeFocusSelector, {
      props: { modelValue: 'medium' },
      ...mountOptions
    })
    const buttons = wrapper.findAll('button')
    const weakButton = buttons[0]
    expect(weakButton).toBeDefined()
    if (!weakButton) {
      throw new Error('Weak button not found')
    }
    await weakButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['weak']])
  })

  it('clicking the slow button emits slow', async () => {
    const wrapper = mount(HomeFocusSelector, {
      props: { modelValue: 'medium' },
      ...mountOptions
    })
    const buttons = wrapper.findAll('button')
    const slowButton = buttons[3]
    expect(slowButton).toBeDefined()
    if (!slowButton) {
      throw new Error('Slow button not found')
    }
    await slowButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['slow']])
  })

  it('hides label when hideLabel=true', () => {
    const wrapper = mount(HomeFocusSelector, {
      props: { modelValue: 'medium', hideLabel: true },
      ...mountOptions
    })
    // The label div uses v-if="!hideLabel"
    expect(wrapper.find('.text-subtitle2').exists()).toBe(false)
  })

  it('shows label when hideLabel is not set', () => {
    const wrapper = mount(HomeFocusSelector, {
      props: { modelValue: 'medium' },
      ...mountOptions
    })
    expect(wrapper.find('.text-subtitle2').exists()).toBe(true)
  })
})
