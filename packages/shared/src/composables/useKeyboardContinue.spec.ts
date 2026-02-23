import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useKeyboardContinue } from './useKeyboardContinue'

function makeWrapper(canProceedInitial: boolean, onContinue: () => void) {
  return defineComponent({
    setup() {
      const canProceed = ref(canProceedInitial)
      const { handleKeyDown } = useKeyboardContinue(canProceed, onContinue)
      return { canProceed, handleKeyDown }
    },
    template: '<div />'
  })
}

function pressEnter(target: EventTarget = document.body) {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  Object.defineProperty(event, 'target', { value: target })
  globalThis.dispatchEvent(event)
  return event
}

describe('useKeyboardContinue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onContinue when Enter is pressed and canProceed is true', () => {
    const onContinue = vi.fn()
    mount(makeWrapper(true, onContinue))
    pressEnter()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('does not call onContinue when canProceed is false', () => {
    const onContinue = vi.fn()
    mount(makeWrapper(false, onContinue))
    pressEnter()
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('does not call onContinue for non-Enter keys', () => {
    const onContinue = vi.fn()
    mount(makeWrapper(true, onContinue))
    const event = new KeyboardEvent('keydown', { key: 'Space', bubbles: true })
    globalThis.dispatchEvent(event)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('does not call onContinue when target is an INPUT element', () => {
    const onContinue = vi.fn()
    const wrapper = mount(makeWrapper(true, onContinue))
    const input = document.createElement('input')
    // Call handleKeyDown directly with an INPUT target
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    Object.defineProperty(event, 'target', { value: input })
    wrapper.vm.handleKeyDown(event)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('does not call onContinue when target is a TEXTAREA element', () => {
    const onContinue = vi.fn()
    const wrapper = mount(makeWrapper(true, onContinue))
    const textarea = document.createElement('textarea')
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    Object.defineProperty(event, 'target', { value: textarea })
    wrapper.vm.handleKeyDown(event)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('removes the listener on unmount so Enter no longer triggers callback', () => {
    const onContinue = vi.fn()
    const wrapper = mount(makeWrapper(true, onContinue))
    wrapper.unmount()
    pressEnter()
    expect(onContinue).not.toHaveBeenCalled()
  })
})
