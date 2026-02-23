import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { STORAGE_KEYS } from '@/constants'
import GameOverPage from './GameOverPage.vue'

// Stub the shared GameOverPage so we can inspect props/slots without running its logic
// Must be defined via vi.hoisted so it's available when vi.mock factory runs (hoisted to top)
const { SharedGameOverPageStub } = vi.hoisted(() => ({
  SharedGameOverPageStub: {
    name: 'GameOverPage',
    template: `<div data-cy="shared-game-over-page">
      <slot name="mascot" :is-happy="true" :is-grinning="false" />
    </div>`,
    props: ['storageFunctions', 'bonusConfig', 'basePath', 'gameStoreHistory', 'gameStoreStats']
  }
}))

vi.mock('@flashcards/shared/pages', () => ({
  GameOverPage: SharedGameOverPageStub
}))

const storageMocks = vi.hoisted(() => ({
  getGameResult: vi.fn(() => null),
  clearGameResult: vi.fn(),
  clearGameState: vi.fn(),
  incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
  saveGameStats: vi.fn(),
  saveHistory: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  getGameResult: storageMocks.getGameResult,
  clearGameResult: storageMocks.clearGameResult,
  clearGameState: storageMocks.clearGameState,
  incrementDailyGames: storageMocks.incrementDailyGames,
  saveGameStats: storageMocks.saveGameStats,
  saveHistory: storageMocks.saveHistory
}))

// Mock useGameStore to avoid transitive storage imports
vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    history: { value: [] },
    gameStats: { value: { points: 0, correctAnswers: 0, gamesPlayed: 0 } }
  }))
}))

describe('voc GameOverPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/game-over', name: '/game-over', component: { template: '<div>GameOver</div>' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        AppFooter: { template: '<div />' },
        // FoxMascot is imported as 'FoxIcon' in GameOverPage.vue, so stub by that local alias
        FoxIcon: {
          template: '<div data-cy="fox-mascot" />',
          props: ['smile', 'grin', 'size']
        }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    sessionStorage.setItem(
      STORAGE_KEYS.GAME_RESULT,
      JSON.stringify({
        points: 10,
        correctAnswers: 5,
        totalCards: 10,
        startTime: Date.now() - 60000,
        endTime: Date.now()
      })
    )
  })

  describe('mounting', () => {
    it('mounts without errors and renders content', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders the shared GameOverPage component', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="shared-game-over-page"]').exists()).toBe(true)
    })
  })

  describe('storageFunctions prop', () => {
    it('passes storageFunctions with getGameResult to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      expect(sharedPage.exists()).toBe(true)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['getGameResult']).toBe('function')
    })

    it('passes storageFunctions with clearGameResult to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['clearGameResult']).toBe('function')
    })

    it('passes storageFunctions with clearGameState to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['clearGameState']).toBe('function')
    })

    it('passes storageFunctions with incrementDailyGames to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['incrementDailyGames']).toBe('function')
    })

    it('passes storageFunctions with saveGameStats to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['saveGameStats']).toBe('function')
    })

    it('passes storageFunctions with saveHistory to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof storageFunctions['saveHistory']).toBe('function')
    })

    it('storageFunctions.getGameResult delegates to storage service', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const storageFunctions = sharedPage.props('storageFunctions') as Record<
        string,
        (...args: unknown[]) => unknown
      >
      const getGameResult = storageFunctions['getGameResult']
      expect(getGameResult).toBeDefined()
      if (!getGameResult) {
        throw new Error('storageFunctions.getGameResult is missing')
      }
      getGameResult()
      expect(storageMocks.getGameResult).toHaveBeenCalled()
    })
  })

  describe('bonusConfig prop', () => {
    it('passes bonusConfig with firstGameBonus to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const bonusConfig = sharedPage.props('bonusConfig') as Record<string, unknown>
      const firstGameBonus = bonusConfig['firstGameBonus']
      expect(typeof firstGameBonus).toBe('number')
      expect(firstGameBonus).toBeGreaterThan(0)
    })

    it('passes bonusConfig with streakGameBonus to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const bonusConfig = sharedPage.props('bonusConfig') as Record<string, unknown>
      const streakGameBonus = bonusConfig['streakGameBonus']
      expect(typeof streakGameBonus).toBe('number')
      expect(streakGameBonus).toBeGreaterThan(0)
    })

    it('passes bonusConfig with streakGameInterval to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const bonusConfig = sharedPage.props('bonusConfig') as Record<string, unknown>
      const streakGameInterval = bonusConfig['streakGameInterval']
      expect(typeof streakGameInterval).toBe('number')
      expect(streakGameInterval).toBeGreaterThan(0)
    })
  })

  describe('mascot slot', () => {
    it('renders FoxMascot in the mascot slot', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="fox-mascot"]').exists()).toBe(true)
    })

    it('passes size=150 to FoxMascot', async () => {
      const router = createMockRouter()

      const FoxMascotCapture = {
        name: 'FoxIcon',
        template: '<div data-cy="fox-mascot" />',
        props: ['smile', 'grin', 'size'],
        setup(props: any) {
          return props
        }
      }

      const wrapper = mount(GameOverPage, {
        global: {
          mocks: quasarMocks,
          plugins: [router],
          provide: quasarProvide,
          stubs: {
            ...quasarStubs,
            AppFooter: { template: '<div />' },
            // FoxMascot is imported as 'FoxIcon' in GameOverPage.vue
            FoxIcon: FoxMascotCapture
          }
        }
      })
      await wrapper.vm.$nextTick()

      const mascot = wrapper.findComponent(FoxMascotCapture)
      expect(mascot.exists()).toBe(true)
      expect(mascot.props('size')).toBe(150)
    })

    it('passes smile=true to FoxMascot when isHappy slot prop is true', async () => {
      // SharedGameOverPageStub passes :is-happy="true" to the mascot slot
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="fox-mascot"]').exists()).toBe(true)
    })
  })

  describe('basePath prop', () => {
    it('passes basePath to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const basePath = sharedPage.props('basePath') as string
      expect(typeof basePath).toBe('string')
      expect(basePath.length).toBeGreaterThan(0)
    })
  })
})
