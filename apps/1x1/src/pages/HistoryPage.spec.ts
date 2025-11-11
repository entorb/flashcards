import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import HistoryPage from './HistoryPage.vue'

import { quasarMocks, quasarProvide, quasarStubs, quasarDirectives } from '@/__tests__/testUtils'
import { initializeCards } from '@/services/storage'

describe('HistoryPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    initializeCards()
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/history', name: '/history', component: { template: '<div>History</div>' } }
      ]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      directives: quasarDirectives,
      stubs: {
        ...quasarStubs,
        AppFooter: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })

  it('renders app footer', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    expect(wrapper.findComponent({ name: 'AppFooter' }).exists()).toBe(true)
  })
})
