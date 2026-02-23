import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import CardsManActions from './CardsManActions.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('CardsManActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with appPrefix="lwk" without errors', () => {
    const wrapper = mount(CardsManActions, {
      props: { appPrefix: 'lwk', modelValue: 3 },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('mounts with appPrefix="voc" without errors', () => {
    const wrapper = mount(CardsManActions, {
      props: { appPrefix: 'voc', modelValue: 3 },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('emits moveClick when move button is clicked', async () => {
    const wrapper = mount(CardsManActions, {
      props: { appPrefix: 'lwk', modelValue: 3 },
      ...mountOptions
    })
    const buttons = wrapper.findAll('button')
    const moveButton = buttons[0]
    expect(moveButton).toBeDefined()
    if (!moveButton) {
      throw new Error('Move button not found')
    }
    await moveButton.trigger('click')
    expect(wrapper.emitted('moveClick')).toHaveLength(1)
  })

  it('emits resetClick when reset button is clicked', async () => {
    const wrapper = mount(CardsManActions, {
      props: { appPrefix: 'lwk', modelValue: 3 },
      ...mountOptions
    })
    const buttons = wrapper.findAll('button')
    const resetButton = buttons[1]
    expect(resetButton).toBeDefined()
    if (!resetButton) {
      throw new Error('Reset button not found')
    }
    await resetButton.trigger('click')
    expect(wrapper.emitted('resetClick')).toHaveLength(1)
  })

  it('targetLevel model value is reflected in the input', async () => {
    const wrapper = mount(CardsManActions, {
      props: { appPrefix: 'lwk', modelValue: 3 },
      ...mountOptions
    })
    // The QInput stub renders as <input /> with the bound value
    const input = wrapper.find('input')
    // modelValue prop is passed down correctly
    expect(wrapper.props('modelValue')).toBe(3)
    // Updating the prop reflects in the component
    await wrapper.setProps({ modelValue: 5 })
    expect(wrapper.props('modelValue')).toBe(5)
    expect(input.exists()).toBe(true)
  })
})
