import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card } from '@/types'
import CardsManPage from './CardsManPage.vue'

// ---------------------------------------------------------------------------
// Storage mocks
// ---------------------------------------------------------------------------

const storageMocks = vi.hoisted(() => ({
  loadCards: vi.fn((): Card[] => [
    { question: '3x3', answer: 9, level: 1, time: 60 },
    { question: '4x3', answer: 12, level: 2, time: 45 },
    { question: '4x4', answer: 16, level: 3, time: 30 }
  ]),
  loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
  saveRange: vi.fn(),
  initializeCards: vi.fn(),
  toggleFeature: vi.fn((current: number[], feature: string) => {
    if (feature === 'feature1x2')
      return current.includes(2) ? current.filter(n => n !== 2) : [2, ...current]
    if (feature === 'feature1x12')
      return current.includes(11) ? current.filter(n => n < 11) : [...current, 11, 12]
    if (feature === 'feature1x20')
      return current.includes(13)
        ? current.filter(n => n < 13)
        : [...current, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    return current
  }),
  createDefaultCard: vi.fn((y: number, x: number) => ({
    question: `${y}x${x}`,
    answer: x * y,
    level: 1,
    time: 60
  }))
}))

vi.mock('@/services/storage', () => ({
  loadCards: storageMocks.loadCards,
  loadRange: storageMocks.loadRange,
  saveRange: storageMocks.saveRange,
  initializeCards: storageMocks.initializeCards,
  toggleFeature: storageMocks.toggleFeature,
  createDefaultCard: storageMocks.createDefaultCard
}))

// ---------------------------------------------------------------------------
// Game store mock
// ---------------------------------------------------------------------------

const gameStoreMocks = vi.hoisted(() => ({
  resetCards: vi.fn(),
  allCards: { value: [] as Card[] }
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: () => ({
    resetCards: gameStoreMocks.resetCards,
    allCards: gameStoreMocks.allCards
  })
}))

// ---------------------------------------------------------------------------
// Shared useResetCards mock
// ---------------------------------------------------------------------------

const resetCardsMocks = vi.hoisted(() => ({
  showResetDialog: vi.fn()
}))

vi.mock('@flashcards/shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@flashcards/shared')>()
  return {
    ...actual,
    useResetCards: () => ({ showResetDialog: resetCardsMocks.showResetDialog })
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: '/', component: { template: '<div>Home</div>' } },
      { path: '/cards', name: '/cards', component: { template: '<div>Cards</div>' } }
    ]
  })
}

function createMountOptions(router: ReturnType<typeof createMockRouter>) {
  return {
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        CardsManLevelDistribution: { template: '<div data-cy="level-distribution" />' },
        CardsListOfCards: { template: '<div data-cy="cards-list" />' }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('1x1 CardsManPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    storageMocks.loadRange.mockReturnValue([3, 4, 5, 6, 7, 8, 9])
    storageMocks.loadCards.mockReturnValue([
      { question: '3x3', answer: 9, level: 1, time: 60 },
      { question: '4x3', answer: 12, level: 2, time: 45 },
      { question: '4x4', answer: 16, level: 3, time: 30 }
    ])
  })

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders back button', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
    })

    it('loads cards and range on mount', async () => {
      const router = createMockRouter()
      mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      expect(storageMocks.loadCards).toHaveBeenCalled()
      expect(storageMocks.loadRange).toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('back button navigates to home', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith('/')
    })

    it('Escape key navigates to home', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await Promise.resolve()
      expect(router.push).toHaveBeenCalledWith('/')
    })

    it('other keys do not navigate', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await Promise.resolve()
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('computed values', () => {
    it('yValues is derived from range', async () => {
      storageMocks.loadRange.mockReturnValue([3, 4, 5])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { yValues: number[] }
      expect(vm.yValues).toEqual([3, 4, 5])
    })

    it('xValues is derived from range', async () => {
      storageMocks.loadRange.mockReturnValue([3, 4, 5])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { xValues: number[] }
      expect(vm.xValues).toEqual([3, 4, 5])
    })

    it('cardsInRange includes all combinations where x <= y', async () => {
      storageMocks.loadRange.mockReturnValue([3, 4])
      storageMocks.loadCards.mockReturnValue([])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { cardsInRange: Card[] }
      // For range [3,4]: 3x3, 4x3, 4x4 → 3 combinations
      expect(vm.cardsInRange).toHaveLength(3)
    })

    it('cardsInRange uses stored card data when available', async () => {
      storageMocks.loadRange.mockReturnValue([3, 4])
      storageMocks.loadCards.mockReturnValue([{ question: '3x3', answer: 9, level: 5, time: 10 }])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { cardsInRange: Card[] }
      const card3x3 = vm.cardsInRange.find(c => c.question === '3x3')
      expect(card3x3?.level).toBe(5)
      expect(card3x3?.time).toBe(10)
    })

    it('minTime returns MIN_TIME when no cards', async () => {
      storageMocks.loadRange.mockReturnValue([])
      storageMocks.loadCards.mockReturnValue([])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { minTime: number }
      expect(typeof vm.minTime).toBe('number')
      expect(vm.minTime).toBeGreaterThanOrEqual(0.1)
    })

    it('maxTime returns MAX_TIME when no cards', async () => {
      storageMocks.loadRange.mockReturnValue([])
      storageMocks.loadCards.mockReturnValue([])
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { maxTime: number }
      expect(typeof vm.maxTime).toBe('number')
      expect(vm.maxTime).toBeLessThanOrEqual(60)
    })
  })

  describe('feature toggles', () => {
    it('renders feature-1x2-toggle button', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      expect(wrapper.find('[data-cy="feature-1x2-toggle"]').exists()).toBe(true)
    })

    it('renders feature-1x12-toggle button', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      expect(wrapper.find('[data-cy="feature-1x12-toggle"]').exists()).toBe(true)
    })

    it('renders feature-1x20-toggle button', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      expect(wrapper.find('[data-cy="feature-1x20-toggle"]').exists()).toBe(true)
    })

    it('clicking feature-1x2-toggle calls toggleFeature and saveRange', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      await wrapper.find('[data-cy="feature-1x2-toggle"]').trigger('click')
      expect(storageMocks.toggleFeature).toHaveBeenCalledWith(expect.any(Array), 'feature1x2')
      expect(storageMocks.saveRange).toHaveBeenCalled()
    })

    it('clicking feature-1x12-toggle calls toggleFeature and saveRange', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      await wrapper.find('[data-cy="feature-1x12-toggle"]').trigger('click')
      expect(storageMocks.toggleFeature).toHaveBeenCalledWith(expect.any(Array), 'feature1x12')
      expect(storageMocks.saveRange).toHaveBeenCalled()
    })

    it('clicking feature-1x20-toggle calls toggleFeature and saveRange', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      await wrapper.find('[data-cy="feature-1x20-toggle"]').trigger('click')
      expect(storageMocks.toggleFeature).toHaveBeenCalledWith(expect.any(Array), 'feature1x20')
      expect(storageMocks.saveRange).toHaveBeenCalled()
    })
  })

  describe('reset cards', () => {
    it('level distribution reset triggers showResetDialog', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()

      // Find the CardsManLevelDistribution stub and emit reset
      const levelDist = wrapper.find('[data-cy="level-distribution"]')
      expect(levelDist.exists()).toBe(true)

      // Trigger reset via the component's resetCardsHandler
      const vm = wrapper.vm as unknown as { resetCardsHandler: () => void }
      vm.resetCardsHandler()
      expect(resetCardsMocks.showResetDialog).toHaveBeenCalled()
    })

    it('showResetDialog callback calls resetCards and reloads cards', async () => {
      // Capture the callback passed to showResetDialog
      let capturedCallback: (() => void) | undefined
      resetCardsMocks.showResetDialog.mockImplementation((cb: () => void) => {
        capturedCallback = cb
      })

      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()

      const vm = wrapper.vm as unknown as { resetCardsHandler: () => void }
      vm.resetCardsHandler()

      expect(capturedCallback).toBeDefined()
      capturedCallback?.()

      expect(gameStoreMocks.resetCards).toHaveBeenCalled()
      expect(storageMocks.loadCards).toHaveBeenCalled()
    })
  })

  describe('keyboard listener cleanup', () => {
    it('removes keydown listener on unmount', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()

      wrapper.unmount()

      // After unmount, Escape should not trigger navigation
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await Promise.resolve()
      expect(router.push).not.toHaveBeenCalled()
    })
  })
})
