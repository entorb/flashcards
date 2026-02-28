import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS } from '@flashcards/shared'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import InfoPage from './InfoPage.vue'

describe('1x1 InfoPage', () => {
  const createRouter_ = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: '/', component: { template: '<div />' } }]
    })

  const createMountOptions = (router: ReturnType<typeof createRouter_>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        // Stub the shared InfoPage to isolate the 1x1 wrapper
        InfoPage: {
          template: '<div data-cy="shared-scoring-rules"><slot /></div>',
          props: ['appName'],
          emits: ['back']
        }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('mounts without errors', async () => {
    const router = createRouter_()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('passes appName="1x1" to shared InfoPage', async () => {
    const router = createRouter_()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(sharedPage.exists()).toBe(true)
    expect(sharedPage.props('appName')).toBe('1x1')
  })

  it('back event from shared page navigates to /', async () => {
    const router = createRouter_()
    vi.spyOn(router, 'push')
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    // Emit the back event from the stubbed shared component
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    await sharedPage.vm.$emit('back')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Escape key navigates to /', async () => {
    const router = createRouter_()
    vi.spyOn(router, 'push')
    mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('non-Escape key does not navigate', async () => {
    const router = createRouter_()
    vi.spyOn(router, 'push')
    mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('removes keydown listener on unmount', async () => {
    const router = createRouter_()
    vi.spyOn(router, 'push')
    const wrapper = mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    wrapper.unmount()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).not.toHaveBeenCalled()
  })

  describe('renders 1x1-specific scoring content (via shared component)', () => {
    const createFullMountOptions = (router: ReturnType<typeof createRouter_>) => ({
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: quasarStubs
      }
    })

    it('renders bonus constants in text', async () => {
      const router = createRouter_()
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toContain(FIRST_GAME_BONUS.toString())
      expect(wrapper.html()).toContain(STREAK_GAME_BONUS.toString())
    })

    it('renders 1x1-specific multiply content', async () => {
      const router = createRouter_()
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      // 1x1 shows multiply difficulty text (e.g. "4x8")
      expect(wrapper.html()).toContain('4x8')
    })

    it('back button click navigates to /', async () => {
      const router = createRouter_()
      vi.spyOn(router, 'push')
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith('/')
    })
  })
})
