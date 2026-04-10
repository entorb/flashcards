import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card, Difficulty, GameSettings, Operation } from '@/types'
import HomePage from './HomePage.vue'

const mocks = vi.hoisted(() => ({
  loadGameStats: vi.fn(() => ({ gamesPlayed: 5, points: 100, correctAnswers: 42 })),
  loadSettings: vi.fn(() => null as null | GameSettings),
  loadCards: vi.fn((): Card[] => []),
  saveSettings: vi.fn(),
  initializeCards: vi.fn(),
  startGame: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  loadGameStats: mocks.loadGameStats,
  loadSettings: mocks.loadSettings,
  loadCards: mocks.loadCards,
  saveSettings: mocks.saveSettings,
  initializeCards: mocks.initializeCards
}))

vi.mock('@/services/cardSelector', () => ({
  filterCards: (cards: Card[]) => cards
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameStats: { value: { gamesPlayed: 0, points: 0, correctAnswers: 0 } },
    gameSettings: { value: null },
    startGame: mocks.startGame
  }))
}))

describe('HomePage — toggle behavior (Req 8)', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/game', name: '/game', component: { template: '<div />' } },
        { path: '/history', name: '/history', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } },
        { path: '/info', name: '/info', component: { template: '<div />' } }
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
        HomeFocusSelector: {
          template: '<div data-cy="focus-selector" />',
          props: ['modelValue'],
          emits: ['update:modelValue']
        },
        HomePageLayout: {
          template: `<div>
            <slot name="mascot" />
            <slot name="config" />
            <button data-cy="start-game-button" @click="$emit('start-game')">Start</button>
            <slot name="extra-buttons" />
            <button data-cy="go-to-history-button" @click="$emit('go-to-history')">History</button>
            <button data-cy="go-to-cards-button" @click="$emit('go-to-cards')">Cards</button>
            <button data-cy="go-to-info-button" @click="$emit('go-to-info')">Info</button>
          </div>`,
          props: ['appTitle', 'basePath', 'statistics'],
          emits: ['start-game', 'go-to-cards', 'go-to-history', 'go-to-info']
        },
        RaccoonMascot: { template: '<div data-cy="mascot" />' }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mocks.loadGameStats.mockReturnValue({ gamesPlayed: 5, points: 100, correctAnswers: 42 })
    mocks.loadSettings.mockReturnValue(null)
    mocks.loadCards.mockReturnValue([])
  })

  // ─── Operation toggle (Req 8) ──────────────────────────────────────────

  describe('operation toggle', () => {
    it('renders operation buttons', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="operation-button-plus"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="operation-button-minus"]').exists()).toBe(true)
    })

    it('all selected + tap one → select only that one', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="operation-button-plus"]').trigger('click')
      const vm = wrapper.vm as unknown as { operations: Operation[] }
      expect(vm.operations).toEqual(['plus'])
    })

    it('one selected + tap same → select all', async () => {
      mocks.loadSettings.mockReturnValue({
        operations: ['plus'],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="operation-button-plus"]').trigger('click')
      const vm = wrapper.vm as unknown as { operations: Operation[] }
      expect(vm.operations).toEqual(['plus', 'minus'])
    })

    it('one selected + tap different → add to selection', async () => {
      mocks.loadSettings.mockReturnValue({
        operations: ['plus'],
        difficulties: ['simple', 'medium', 'advanced'],
        focus: 'weak'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="operation-button-minus"]').trigger('click')
      const vm = wrapper.vm as unknown as { operations: Operation[] }
      expect(vm.operations).toContain('plus')
      expect(vm.operations).toContain('minus')
    })
  })

  // ─── Difficulty toggle (Req 8) ─────────────────────────────────────────

  describe('difficulty toggle', () => {
    it('renders difficulty buttons', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="difficulty-button-simple"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="difficulty-button-medium"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="difficulty-button-advanced"]').exists()).toBe(true)
    })

    it('all selected + tap one → select only that one', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="difficulty-button-simple"]').trigger('click')
      const vm = wrapper.vm as unknown as { difficulties: Difficulty[] }
      expect(vm.difficulties).toEqual(['simple'])
    })

    it('one selected + tap same → select all', async () => {
      mocks.loadSettings.mockReturnValue({
        operations: ['plus', 'minus'],
        difficulties: ['medium'],
        focus: 'weak'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="difficulty-button-medium"]').trigger('click')
      const vm = wrapper.vm as unknown as { difficulties: Difficulty[] }
      expect(vm.difficulties).toEqual(['simple', 'medium', 'advanced'])
    })

    it('one selected + tap different → add to selection', async () => {
      mocks.loadSettings.mockReturnValue({
        operations: ['plus', 'minus'],
        difficulties: ['simple'],
        focus: 'weak'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="difficulty-button-advanced"]').trigger('click')
      const vm = wrapper.vm as unknown as { difficulties: Difficulty[] }
      expect(vm.difficulties).toContain('simple')
      expect(vm.difficulties).toContain('advanced')
    })

    it('multiple (not all) selected + tap selected → select all', async () => {
      mocks.loadSettings.mockReturnValue({
        operations: ['plus', 'minus'],
        difficulties: ['simple', 'medium'],
        focus: 'weak'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="difficulty-button-simple"]').trigger('click')
      const vm = wrapper.vm as unknown as { difficulties: Difficulty[] }
      expect(vm.difficulties).toEqual(['simple', 'medium', 'advanced'])
    })
  })
})
