import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS } from '@flashcards/shared'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import InfoPage from './InfoPage.vue'

describe('lwk InfoPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: '/', component: { template: '<div />' } }]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        InfoPage: {
          template: '<div data-cy="shared-scoring-rules"><slot /></div>',
          props: ['appName', 'pointsModeHidden'],
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

  // ─── Mounting ─────────────────────────────────────────────────────────────

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('passes appName="lwk" to shared InfoPage', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(sharedPage.exists()).toBe(true)
    expect(sharedPage.props('appName')).toBe('lwk')
  })

  it('passes pointsModeHidden constant to shared InfoPage', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(typeof sharedPage.props('pointsModeHidden')).toBe('number')
    expect(sharedPage.props('pointsModeHidden') as number).toBeGreaterThan(0)
  })

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('back event from shared page navigates to /', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    await sharedPage.vm.$emit('back')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Escape key navigates to /', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('non-Escape key does not navigate', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('removes keydown listener on unmount', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const wrapper = mount(InfoPage, createMountOptions(router))
    await Promise.resolve()
    wrapper.unmount()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).not.toHaveBeenCalled()
  })

  // ─── Full render (no stub) ────────────────────────────────────────────────

  describe('renders lwk-specific scoring content', () => {
    const createFullMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: quasarStubs
      }
    })

    it('renders bonus constants in text', async () => {
      const router = createMockRouter()
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toContain(FIRST_GAME_BONUS.toString())
      expect(wrapper.html()).toContain(STREAK_GAME_BONUS.toString())
    })

    it('back button click navigates to /', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(InfoPage, createFullMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith('/')
    })
  })
})
