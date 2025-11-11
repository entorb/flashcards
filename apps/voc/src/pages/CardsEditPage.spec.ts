import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import CardsEditPage from './CardsEditPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('CardsEditPage Component', () => {
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
        { path: '/cards', name: '/cards', component: { template: '<div>Cards</div>' } },
        {
          path: '/cards-edit',
          name: '/cards-edit',
          component: { template: '<div>CardsEdit</div>' }
        }
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
        DeckSelector: { template: '<div />' },
        CardManagementCard: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })

  it('renders deck selector', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    expect(wrapper.findComponent({ name: 'DeckSelector' }).exists()).toBe(true)
  })

  it('renders app footer', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    expect(wrapper.findComponent({ name: 'AppFooter' }).exists()).toBe(true)
  })
})
