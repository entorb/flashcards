import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import GamePage from './GamePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('GamePage Component', () => {
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
        { path: '/game-over', name: '/game-over', component: { template: '<div>GameOver</div>' } }
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
        FlashCard: { template: '<div />' }
      }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders home button', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="home-button"]').exists()).toBe(true)
  })

  it('renders progress indicator', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="progress"]').exists()).toBe(true)
  })

  it('renders points display', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    expect(wrapper.find('[data-cy="points"]').exists()).toBe(true)
  })
})
