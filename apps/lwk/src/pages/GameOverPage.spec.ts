import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { STORAGE_KEYS } from '@/constants'
import GameOverPage from './GameOverPage.vue'

// ---------------------------------------------------------------------------
// Stub the shared GameOverPage so we can inspect props/slots without its logic
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Storage mocks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk GameOverPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/game-over', name: '/game-over', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        // EisiMascot is imported as 'EisiMascot' in GameOverPage.vue template
        EisiMascot: {
          template: '<div data-cy="eisi-mascot" />',
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
      JSON.stringify({ points: 10, correctAnswers: 5, totalCards: 10 })
    )
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the shared GameOverPage component', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="shared-game-over-page"]').exists()).toBe(true)
    })
  })

  // ─── storageFunctions prop ────────────────────────────────────────────────

  describe('storageFunctions prop', () => {
    it('passes all required storage functions to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const sf = sharedPage.props('storageFunctions') as Record<string, unknown>
      expect(typeof sf['getGameResult']).toBe('function')
      expect(typeof sf['clearGameResult']).toBe('function')
      expect(typeof sf['clearGameState']).toBe('function')
      expect(typeof sf['incrementDailyGames']).toBe('function')
      expect(typeof sf['saveGameStats']).toBe('function')
      expect(typeof sf['saveHistory']).toBe('function')
    })

    it('storageFunctions.getGameResult delegates to storage service', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const sf = sharedPage.props('storageFunctions') as Record<
        string,
        (...args: unknown[]) => unknown
      >
      const getGameResult = sf['getGameResult']
      expect(getGameResult).toBeDefined()
      if (!getGameResult) {
        throw new Error('storageFunctions.getGameResult is missing')
      }
      getGameResult()
      expect(storageMocks.getGameResult).toHaveBeenCalled()
    })

    it('storageFunctions.clearGameResult delegates to storage service', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const sf = sharedPage.props('storageFunctions') as Record<
        string,
        (...args: unknown[]) => unknown
      >
      const clearGameResult = sf['clearGameResult']
      expect(clearGameResult).toBeDefined()
      if (!clearGameResult) {
        throw new Error('storageFunctions.clearGameResult is missing')
      }
      clearGameResult()
      expect(storageMocks.clearGameResult).toHaveBeenCalled()
    })
  })

  // ─── bonusConfig prop ─────────────────────────────────────────────────────

  describe('bonusConfig prop', () => {
    it('passes bonusConfig with positive numeric values', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const bc = sharedPage.props('bonusConfig') as Record<string, unknown>
      expect(typeof bc['firstGameBonus']).toBe('number')
      expect(typeof bc['streakGameBonus']).toBe('number')
      expect(typeof bc['streakGameInterval']).toBe('number')
      expect(bc['firstGameBonus'] as number).toBeGreaterThan(0)
      expect(bc['streakGameBonus'] as number).toBeGreaterThan(0)
      expect(bc['streakGameInterval'] as number).toBeGreaterThan(0)
    })
  })

  // ─── basePath prop ────────────────────────────────────────────────────────

  describe('basePath prop', () => {
    it('passes a non-empty basePath string to shared GameOverPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
      const basePath = sharedPage.props('basePath') as string
      expect(typeof basePath).toBe('string')
      expect(basePath.length).toBeGreaterThan(0)
    })
  })

  // ─── mascot slot ──────────────────────────────────────────────────────────

  describe('mascot slot', () => {
    it('renders EisiMascot in the mascot slot', async () => {
      const router = createMockRouter()
      const wrapper = mount(GameOverPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="eisi-mascot"]').exists()).toBe(true)
    })

    it('passes size=150 to EisiMascot', async () => {
      const router = createMockRouter()
      const EisiCapture = {
        name: 'EisiMascot',
        template: '<div data-cy="eisi-mascot" />',
        props: ['smile', 'grin', 'size']
      }
      const wrapper = mount(GameOverPage, {
        global: {
          mocks: quasarMocks,
          plugins: [router],
          provide: quasarProvide,
          stubs: { ...quasarStubs, EisiMascot: EisiCapture }
        }
      })
      await wrapper.vm.$nextTick()
      const mascot = wrapper.findComponent(EisiCapture)
      expect(mascot.exists()).toBe(true)
      expect(mascot.props('size')).toBe(150)
    })
  })
})
