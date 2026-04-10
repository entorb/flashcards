import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PumToggleButtons from './PumToggleButtons.vue'

const buttons = [
  { value: 'a', label: 'Alpha', dataCy: 'btn-a' },
  { value: 'b', label: 'Beta', dataCy: 'btn-b' },
  { value: 'c', label: 'Gamma', dataCy: 'btn-c' }
]

function mountToggle(modelValue: string[]) {
  return mount(PumToggleButtons, {
    props: { title: 'Test', buttons, modelValue },
    global: {
      mocks: quasarMocks,
      provide: quasarProvide,
      stubs: quasarStubs
    }
  })
}

describe('PumToggleButtons', () => {
  it('mounts without errors', () => {
    const wrapper = mountToggle(['a', 'b', 'c'])
    expect(wrapper.exists()).toBe(true)
  })

  it('renders a button for each entry in the buttons prop', () => {
    const wrapper = mountToggle(['a', 'b', 'c'])
    expect(wrapper.find('[data-cy="btn-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="btn-b"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="btn-c"]').exists()).toBe(true)
  })

  it('all selected + tap one → select only that one', async () => {
    const wrapper = mountToggle(['a', 'b', 'c'])
    await wrapper.find('[data-cy="btn-a"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toEqual(['a'])
  })

  it('one selected + tap same → select all', async () => {
    const wrapper = mountToggle(['b'])
    await wrapper.find('[data-cy="btn-b"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toEqual(['a', 'b', 'c'])
  })

  it('one selected + tap different → add to selection', async () => {
    const wrapper = mountToggle(['a'])
    await wrapper.find('[data-cy="btn-c"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toContain('a')
    expect(emitted?.[0]?.[0]).toContain('c')
  })

  it('multiple (not all) selected + tap selected → select all', async () => {
    const wrapper = mountToggle(['a', 'b'])
    await wrapper.find('[data-cy="btn-a"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toEqual(['a', 'b', 'c'])
  })
})
