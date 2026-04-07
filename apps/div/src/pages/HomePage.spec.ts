import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card } from '@/types'
import HomePage from './HomePage.vue'

const mocks = vi.hoisted(() => ({
  loadGameStats: vi.fn(() => ({ gamesPlayed: 5, points: 100, correctAnswers: 42 })),
  loadSettings: vi.fn(() => null as null | { select: number[]; focus: string }),
  loadRange: vi.fn(() => [2, 3, 4, 5, 6, 7, 8, 9]),
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
  filterCardsByDivisor: (cards: Card[]) => cards
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
        ChickenMascot: { template: '<div data-cy="mascot" />' }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mocks.loadGameStats.mockReturnValue({ gamesPlayed: 5, points: 100, correctAnswers: 42 })
    mocks.loadSettings.mockReturnValue(null)
    mocks.loadRange.mockReturnValue([2, 3, 4, 5, 6, 7, 8, 9])
  })

  // ==========================================================================
  // Unit Tests (Task 12.3)
  // ==========================================================================

  describe('mascot rendering', () => {
    it('renders ChickenMascot with data-cy="mascot"', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="mascot"]').exists()).toBe(true)
    })
  })

  describe('focus selector', () => {
    it('renders HomeFocusSelector', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="focus-selector"]').exists()).toBe(true)
    })
  })

  describe('divisor button toggle', () => {
    it('renders a button for each divisor 2–9', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      for (const num of [2, 3, 4, 5, 6, 7, 8, 9]) {
        expect(wrapper.find(`[data-cy="table-selection-button-${num}"]`).exists()).toBe(true)
      }
    })

    it('clicking a number when all are selected selects only that number', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="table-selection-button-5"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] }
      expect(vm.select).toEqual([5])
    })

    it('clicking an already-selected single number selects all in range', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      // First click: isolate to [5]
      await wrapper.find('[data-cy="table-selection-button-5"]').trigger('click')
      // Second click on 5: should restore all
      await wrapper.find('[data-cy="table-selection-button-5"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] }
      expect(vm.select).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('clicking an unselected number adds it to the selection', async () => {
      mocks.loadSettings.mockReturnValue({ select: [2, 3], focus: 'weak' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="table-selection-button-7"]').trigger('click')
      const vm = wrapper.vm as unknown as { select: number[] }
      expect(vm.select).toContain(7)
      expect(vm.select).toContain(2)
      expect(vm.select).toContain(3)
    })
  })

  describe('game start', () => {
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

  // ==========================================================================
  // Property-Based Tests (Task 12.2)
  // ==========================================================================

  // Feature: div-app, Property 7: Divisor toggle selection logic
  // **Validates: Requirements 7.3**
  describe('Divisor toggle selection logic — property test', () => {
    /**
     * QBtn stub that forwards the `data-cy` attr and fires click events,
     * so we can trigger toggleSelect via the rendered buttons.
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
                '<button :data-cy="$attrs[\'data-cy\']" @click="$emit(\'click\')"><slot /></button>',
              props: ['outline', 'unelevated', 'color', 'size', 'icon', 'disable'],
              emits: ['click'],
              inheritAttrs: false
            }
          }
        }
      }
    }

    const allDivisors = [2, 3, 4, 5, 6, 7, 8, 9]
    const divisorArb = fc.constantFrom(...allDivisors)

    it('all selected + tap D → [D]', async () => {
      await fc.assert(
        fc.asyncProperty(divisorArb, async d => {
          mocks.loadSettings.mockReturnValue(null) // defaults to all selected
          const router = createMockRouter()
          const wrapper = mount(HomePage, createPropertyMountOptions(router))
          await wrapper.vm.$nextTick()

          // Verify all are selected initially
          const vm = wrapper.vm as unknown as { select: number[] }
          expect(vm.select).toEqual(allDivisors)

          // Tap D
          await wrapper.find(`[data-cy="table-selection-button-${d}"]`).trigger('click')
          expect(vm.select).toEqual([d])

          wrapper.unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('only [D] selected + tap D → all', async () => {
      await fc.assert(
        fc.asyncProperty(divisorArb, async d => {
          mocks.loadSettings.mockReturnValue({ select: [d], focus: 'weak' })
          const router = createMockRouter()
          const wrapper = mount(HomePage, createPropertyMountOptions(router))
          await wrapper.vm.$nextTick()

          const vm = wrapper.vm as unknown as { select: number[] }
          expect(vm.select).toEqual([d])

          // Tap D again
          await wrapper.find(`[data-cy="table-selection-button-${d}"]`).trigger('click')
          expect(vm.select).toEqual(allDivisors)

          wrapper.unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('D not selected + tap D → add D', async () => {
      // Generate a subset that does NOT include D, and is not all-selected
      const subsetWithoutD = fc
        .tuple(divisorArb, fc.subarray([2, 3, 4, 5, 6, 7, 8, 9], { minLength: 1, maxLength: 7 }))
        .filter(([d, subset]) => !subset.includes(d) && subset.length < allDivisors.length)

      await fc.assert(
        fc.asyncProperty(subsetWithoutD, async ([d, subset]) => {
          mocks.loadSettings.mockReturnValue({ select: [...subset], focus: 'weak' })
          const router = createMockRouter()
          const wrapper = mount(HomePage, createPropertyMountOptions(router))
          await wrapper.vm.$nextTick()

          const vm = wrapper.vm as unknown as { select: number[] }
          expect(vm.select).not.toContain(d)

          // Tap D
          await wrapper.find(`[data-cy="table-selection-button-${d}"]`).trigger('click')
          expect(vm.select).toContain(d)
          // All previous selections should still be present
          for (const s of subset) {
            expect(vm.select).toContain(s)
          }

          wrapper.unmount()
        }),
        { numRuns: 100 }
      )
    })
  })
})
