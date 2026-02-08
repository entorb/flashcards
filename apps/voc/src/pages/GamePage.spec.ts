import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import GamePage from './GamePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { STORAGE_KEYS } from '@/constants'
import { loadDecks } from '@/services/storage'

describe('GamePage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    loadDecks() // Initialize default decks
    // Set up minimal game state to prevent redirect
    sessionStorage.setItem(
      STORAGE_KEYS.GAME_SETTINGS,
      JSON.stringify({
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'en',
        deck: 'en'
      })
    )
    sessionStorage.setItem(
      STORAGE_KEYS.GAME_STATE,
      JSON.stringify({
        gameCards: [
          { voc: 'hello', de: 'hallo', level: 1, time: 60 },
          { voc: 'world', de: 'welt', level: 1, time: 60 }
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
      stubs: quasarStubs
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders question display', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="question-display"]').exists()).toBe(true)
  })

  it('renders multiple-choice options for MC mode', async () => {
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const options = wrapper.findAll('[data-cy="multiple-choice-option"]')
    expect(options).toHaveLength(4)
  })
})
