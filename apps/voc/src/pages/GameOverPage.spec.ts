import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import GameOverPage from './GameOverPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('GameOverPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    loadDecks() // Initialize default decks
    // Set up minimal game result in sessionStorage
    sessionStorage.setItem(
      'voc-game-result',
      JSON.stringify({
        points: 10,
        correctAnswers: 5,
        totalCards: 10,
        startTime: Date.now() - 60000,
        endTime: Date.now()
      })
    )
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
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
        AppFooter: { template: '<div />' }
      }
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })
})
