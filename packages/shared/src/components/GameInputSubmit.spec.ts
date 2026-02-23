import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GameInputSubmit from './GameInputSubmit.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('GameInputSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders answer-input and submit-answer-button data-cy elements', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="submit-answer-button"]').exists()).toBe(true)
  })

  it('submit button has disable attribute when input is empty', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    // canSubmit=false when empty → QBtn receives :disable="true"
    // Vue renders boolean props as attributes on stub elements
    const btn = wrapper.find('[data-cy="submit-answer-button"]')
    expect(btn.attributes('disable')).toBe('true')
  })

  it('submit button calls onSubmit when clicked with a value', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: 'Antwort', buttonDisabled: false, onSubmit, inputType: 'text' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="submit-answer-button"]').trigger('click')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('submit button has disable attribute when buttonDisabled=true', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: 'Antwort', buttonDisabled: true, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    const btn = wrapper.find('[data-cy="submit-answer-button"]')
    expect(btn.attributes('disable')).toBe('true')
  })

  it('renders answer-input-container', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="answer-input-container"]').exists()).toBe(true)
  })

  it('calls onSubmit on Enter key when canSubmit is true', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: 'Antwort', buttonDisabled: false, onSubmit, inputType: 'text' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="answer-input"]').trigger('keyup.enter')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('does not call onSubmit on Enter key when input is empty', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit, inputType: 'text' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="answer-input"]').trigger('keyup.enter')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders with numeric inputType without errors', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: null, buttonDisabled: false, onSubmit: vi.fn(), inputType: 'numeric' },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
  })
})

describe('numeric input rules', () => {
  it('inputRules allows null value for numeric type', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: null, buttonDisabled: false, onSubmit: vi.fn(), inputType: 'numeric' },
      ...mountOptions
    })
    // Access the component's computed inputRules via vm
    const vm = wrapper.vm as unknown as { inputRules: ((val: unknown) => boolean)[] }
    expect(vm.inputRules[0]?.(null)).toBe(true)
  })

  it('inputRules allows integer value for numeric type', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: 5, buttonDisabled: false, onSubmit: vi.fn(), inputType: 'numeric' },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { inputRules: ((val: unknown) => boolean)[] }
    expect(vm.inputRules[0]?.(5)).toBe(true)
  })

  it('inputRules rejects non-integer for numeric type', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: 3.5, buttonDisabled: false, onSubmit: vi.fn(), inputType: 'numeric' },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { inputRules: ((val: unknown) => boolean)[] }
    expect(vm.inputRules[0]?.(3.5)).toBe(false)
  })

  it('inputRules is empty array for text type', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { inputRules: unknown[] }
    expect(vm.inputRules).toHaveLength(0)
  })

  it('pattern is undefined for text inputType', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: '', buttonDisabled: false, onSubmit: vi.fn(), inputType: 'text' },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { pattern: string | undefined }
    expect(vm.pattern).toBeUndefined()
  })

  it('pattern is [0-9]* for numeric inputType', () => {
    const wrapper = mount(GameInputSubmit, {
      props: { modelValue: null, buttonDisabled: false, onSubmit: vi.fn(), inputType: 'numeric' },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { pattern: string | undefined }
    expect(vm.pattern).toBe('[0-9]*')
  })
})
