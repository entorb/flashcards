import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomePage from './HomePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { initializeCards } from '@/services/storage'

describe('HomePage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    initializeCards()
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/game', name: '/game', component: { template: '<div>Game</div>' } },
        { path: '/history', name: '/history', component: { template: '<div>History</div>' } },
        { path: '/cards', name: '/cards', component: { template: '<div>Cards</div>' } }
      ]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        AppFooter: { template: '<div />' },
        FocusSelector: { template: '<div />' },
        PwaInstallInfo: { template: '<div />' },
        StatisticsCard: { template: '<div />' },
        GroundhogMascot: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page content', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.q-page').exists()).toBe(true)
  })
})
