import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import DecksEditPage from './DecksEditPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('DecksEditPage Component', () => {
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
        {
          path: '/decks-edit',
          name: '/decks-edit',
          component: { template: '<div>DecksEdit</div>' }
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
        AppFooter: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(DecksEditPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(DecksEditPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })

  it('renders app footer', async () => {
    const router = createMockRouter()
    const wrapper = mount(DecksEditPage, createMountOptions(router))
    expect(wrapper.findComponent({ name: 'AppFooter' }).exists()).toBe(true)
  })

  it('renders add deck button', async () => {
    const router = createMockRouter()
    const wrapper = mount(DecksEditPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="add-deck"]').exists()).toBe(true)
  })
})
