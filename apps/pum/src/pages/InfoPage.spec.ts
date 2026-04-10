import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import InfoPage from './InfoPage.vue'

describe('pum InfoPage', () => {
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
          template: '<div data-cy="shared-info-page"><slot /></div>',
          props: ['appName'],
          emits: ['back']
        }
      }
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('passes appName="pum" to shared InfoPage', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent({ name: 'InfoPage' })
    expect(sharedPage.props('appName')).toBe('pum')
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
})
