import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomePage from './HomePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('HomePage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    loadDecks() // Initialize default decks
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/game', name: '/game', component: { template: '<div>Game</div>' } },
        { path: '/history', name: '/history', component: { template: '<div>History</div>' } },
        { path: '/cards', name: '/cards', component: { template: '<div>Cards</div>' } },
        { path: '/info', name: '/info', component: { template: '<div>Info</div>' } }
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
        LanguagePicker: { template: '<div />' },
        DeckSelector: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders multiple-choice mode button', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="mode-multiple-choice"]').exists()).toBe(true)
  })

  it('renders blind mode button', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="mode-blind"]').exists()).toBe(true)
  })

  it('renders typing mode button', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="mode-typing"]').exists()).toBe(true)
  })
})
