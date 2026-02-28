import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS } from '@flashcards/shared'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import InfoPage from './InfoPage.vue'

describe('voc InfoPage', () => {
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
        // Stub the shared InfoPage to isolate the voc wrapper
        InfoPage: {
          template: '<div data-cy="shared-scoring-rules"><slot /></div>',
          props: ['appName', 'pointsModeBlind', 'pointsModeTyping', 'pointsLanguageDirection'],
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

  it('passes appName="voc" to shared InfoPage', async () => {
    const router = createRouter_()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(sharedPage.exists()).toBe(true)
    expect(sharedPage.props('appName')).toBe('voc')
  })

  it('passes voc-specific point constants to shared InfoPage', async () => {
    const router = createRouter_()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(sharedPage.props('pointsModeBlind')).toBe(4)
    expect(sharedPage.props('pointsModeTyping')).toBe(8)
    expect(sharedPage.props('pointsLanguageDirection')).toBe(1)
  })

  it('back event from shared page navigates to /', async () => {
    const router = createRouter_()
    vi.spyOn(router, 'push')
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
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

  describe('renders voc-specific scoring content (via shared component)', () => {
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

    it('renders voc-specific mode content (blind and typing)', async () => {
      const router = createRouter_()
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      // voc shows blind mode points (4) and typing mode points (8)
      expect(wrapper.html()).toContain('4')
      expect(wrapper.html()).toContain('8')
    })

    it('renders voc additional rules section', async () => {
      const router = createRouter_()
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      // voc shows close match and language direction rules
      expect(wrapper.html()).toContain('75%')
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
