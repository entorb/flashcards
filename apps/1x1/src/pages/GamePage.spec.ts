import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import GamePage from './GamePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { initializeCards } from '@/services/storage'

describe('GamePage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    initializeCards()
    // Set up minimal game state to prevent redirect
    sessionStorage.setItem(
      '1x1-game-settings',
      JSON.stringify({
        select: [3, 4, 5],
        focus: 'weak'
      })
    )
    sessionStorage.setItem(
      '1x1-game-state',
      JSON.stringify({
        gameCards: [
          { question: '3 × 3', answer: 9, level: 1, time: 60 },
          { question: '4 × 4', answer: 16, level: 1, time: 60 }
        ],
        currentCardIndex: 0,
        points: 0,
        correctAnswersCount: 0
      })
    )
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

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })
})
