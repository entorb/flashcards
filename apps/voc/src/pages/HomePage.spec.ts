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

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })

  it('disables multiple choice button when no level 1 cards exist', async () => {
    const router = createMockRouter()

    // Move all cards to level 2 to simulate no level 1 cards
    const { useGameStore } = await import('@/composables/useGameStore')
    const store = useGameStore()
    store.moveAllCards(2)

    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    // Check that hasLevel1Cards is false
    const vm = wrapper.vm as unknown as { hasLevel1Cards: boolean }
    expect(vm.hasLevel1Cards).toBe(false)
  })

  it('disables blind mode button when no level 1 or 2 cards exist', async () => {
    const router = createMockRouter()

    // Move all cards to level 3 to simulate no level 1 or 2 cards
    const { useGameStore } = await import('@/composables/useGameStore')
    const store = useGameStore()
    store.moveAllCards(3)

    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    // Check that hasLevel1Or2Cards is false
    const vm = wrapper.vm as unknown as { hasLevel1Or2Cards: boolean }
    expect(vm.hasLevel1Or2Cards).toBe(false)
  })
})
