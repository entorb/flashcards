import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { MIN_LEVEL, MAX_LEVEL } from '@flashcards/shared'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card } from '@/types'
import HomePage from './HomePage.vue'

const mocks = vi.hoisted(() => ({
  loadGameStats: vi.fn(() => ({ gamesPlayed: 5, points: 100, correctAnswers: 42 })),
  loadSettings: vi.fn(() => null as null | { select: number[] | string; focus: string }),
  loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
  saveSettings: vi.fn(),
  initializeCards: vi.fn(),
  startGame: vi.fn(),
  getVirtualCardsForRange: vi.fn((): Card[] => [])
}))

vi.mock('@/services/storage', () => ({
  loadGameStats: mocks.loadGameStats,
  loadSettings: mocks.loadSettings,
  loadRange: mocks.loadRange,
  saveSettings: mocks.saveSettings,
  initializeCards: mocks.initializeCards,
  getVirtualCardsForRange: mocks.getVirtualCardsForRange
}))

vi.mock('@/services/cardSelector', () => ({
  filterCardsAll: (cards: Card[]) => cards,
  filterCardsBySelection: (cards: Card[]) => cards,
  filterCardsSquares: (cards: Card[]) => cards
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameStats: { value: { gamesPlayed: 0, points: 0, correctAnswers: 0 } },
    gameSettings: { value: null },
    startGame: mocks.startGame
  }))
}))

describe('HomePage', () => {
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
        GroundhogMascot: { template: '<div data-cy="mascot" />' }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mocks.loadGameStats.mockReturnValue({ gamesPlayed: 5, points: 100, correctAnswers: 42 })
    mocks.loadSettings.mockReturnValue(null)
    mocks.loadRange.mockReturnValue([3, 4, 5, 6, 7, 8, 9])
  })

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('loads range on mount', async () => {
      const router = createMockRouter()
      mount(HomePage, createMountOptions(router))
      await Promise.resolve()
      expect(mocks.loadRange).toHaveBeenCalled()
    })

    it('loads game stats on mount', async () => {
      const router = createMockRouter()
      mount(HomePage, createMountOptions(router))
      await Promise.resolve()
      expect(mocks.loadGameStats).toHaveBeenCalled()
    })

    it('loads saved settings on mount when available', async () => {
      mocks.loadSettings.mockReturnValue({ select: [3, 5], focus: 'strong' })
      const router = createMockRouter()
      mount(HomePage, createMountOptions(router))
      await Promise.resolve()
      expect(mocks.loadSettings).toHaveBeenCalled()
    })
  })

  describe('start game button', () => {
    it('renders start game button', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="start-game-button"]').exists()).toBe(true)
    })

    it('navigates to /game when start game button is clicked', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/game' })
    })

    it('saves settings when start game is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(mocks.saveSettings).toHaveBeenCalled()
    })

    it('calls storeStartGame when start game is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(mocks.startGame).toHaveBeenCalled()
    })
  })

  describe('focus selector', () => {
    it('renders focus selector', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="focus-selector"]').exists()).toBe(true)
    })
  })

  describe('mascot', () => {
    it('renders mascot', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="mascot"]').exists()).toBe(true)
    })
  })

  describe('table selection buttons', () => {
    it('renders a button for each number in the range', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      for (const num of [3, 4, 5, 6, 7, 8, 9]) {
        expect(wrapper.find(`[data-cy="table-selection-button-${num}"]`).exists()).toBe(true)
      }
    })

    it('renders the squares button', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="table-selection-button-squares"]').exists()).toBe(true)
    })

    it('clicking a number when all are selected selects only that number', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="table-selection-button-3"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(vm.select).toEqual([3])
    })

    it('clicking an already-selected single number selects all in range', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      // First click: isolate to [3]
      await wrapper.find('[data-cy="table-selection-button-3"]').trigger('click')
      // Second click on 3: should restore all in range
      await wrapper.find('[data-cy="table-selection-button-3"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(Array.isArray(vm.select)).toBe(true)
      expect((vm.select as number[]).length).toBeGreaterThan(1)
    })

    it('clicking squares selects x² mode', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="table-selection-button-squares"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(vm.select).toBe('x²')
    })

    it('clicking squares again deselects and returns to all in range', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="table-selection-button-squares"]').trigger('click')
      await wrapper.find('[data-cy="table-selection-button-squares"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(Array.isArray(vm.select)).toBe(true)
    })
  })

  describe('navigation', () => {
    it('navigates to /history when go-to-history is triggered', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-history-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/history' })
    })

    it('navigates to /cards when go-to-cards is triggered', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-cards-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/cards' })
    })

    it('navigates to /info when go-to-info is triggered', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-info-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/info' })
    })
  })

  describe('settings persistence', () => {
    it('applies saved focus setting on mount', async () => {
      mocks.loadSettings.mockReturnValue({ select: [3, 5], focus: 'strong' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { focus: string }
      expect(vm.focus).toBe('strong')
    })

    it('applies saved select setting on mount', async () => {
      mocks.loadSettings.mockReturnValue({ select: [4, 6], focus: 'weak' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(vm.select).toEqual([4, 6])
    })

    it('uses default select (all in range) when no saved settings', async () => {
      mocks.loadSettings.mockReturnValue(null)
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { select: number[] | string }
      expect(vm.select).toEqual([3, 4, 5, 6, 7, 8, 9])
    })

    it('passes saved config to saveSettings on start game', async () => {
      mocks.loadSettings.mockReturnValue({ select: [3, 5], focus: 'strong' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(mocks.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ select: [3, 5], focus: 'strong' })
      )
    })
  })

  // Feature: game-modes-endless-and-loops, Property 8
  // **Validates: Requirements 2.3, 2.4**
  describe('Endless Level 1 button disabled state — property test', () => {
    /**
     * Arbitrary: generates a 1x1 Card with a random level and a valid question format.
     * The cardSelector mock passes all cards through, so the question format doesn't matter
     * for filtering — only the level matters for filterLevel1Cards.
     */
    const cardArb = fc
      .record({
        level: fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        time: fc.integer({ min: 1, max: 60 }),
        question: fc.constant('3x3'),
        answer: fc.constant(9)
      })
      .map((r): Card => r)

    /**
     * Mount options with a QBtn stub that forwards the `disable` prop as the
     * HTML `disabled` attribute, so we can observe it in the rendered output.
     */
    const createPropertyMountOptions = (router: ReturnType<typeof createMockRouter>) => {
      const base = createMountOptions(router)
      return {
        ...base,
        global: {
          ...base.global,
          stubs: {
            ...base.global.stubs,
            QBtn: {
              template:
                '<button :disabled="disable || undefined" :data-cy="$attrs[\'data-cy\']"><slot /></button>',
              props: ['disable', 'color', 'size', 'icon', 'outline', 'unelevated'],
              inheritAttrs: false
            }
          }
        }
      }
    }

    it('button is disabled iff no card has level === 1', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(cardArb, { minLength: 0, maxLength: 20 }), async cards => {
          mocks.getVirtualCardsForRange.mockReturnValue(cards)

          const router = createMockRouter()
          const wrapper = mount(HomePage, createPropertyMountOptions(router))
          await wrapper.vm.$nextTick()

          const button = wrapper.find('[data-cy="start-endless-level1"]')
          expect(button.exists()).toBe(true)

          const hasAnyLevel1 = cards.some(c => c.level === MIN_LEVEL)
          const isDisabled = button.attributes('disabled') !== undefined

          expect(isDisabled).toBe(!hasAnyLevel1)

          wrapper.unmount()
        }),
        { numRuns: 100 }
      )
    })
  })
})
