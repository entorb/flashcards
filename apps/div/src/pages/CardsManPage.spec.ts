import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card } from '@/types'
import CardsManPage from './CardsManPage.vue'

// ---------------------------------------------------------------------------
// Storage mocks
// ---------------------------------------------------------------------------

const storageMocks = vi.hoisted(() => ({
  loadCards: vi.fn((): Card[] => [
    { question: '6:2', answer: 3, level: 1, time: 60 },
    { question: '12:3', answer: 4, level: 2, time: 45 }
  ]),
  loadRange: vi.fn(() => [2, 3, 4, 5, 6, 7, 8, 9]),
  saveRange: vi.fn(),
  toggleFeature50: vi.fn((current: number[]) =>
    current.some(n => n > 9) ? [2, 3, 4, 5, 6, 7, 8, 9] : [...current, 11, 12]
  ),
  parseCardQuestion: vi.fn((question: string) => {
    const [dividendStr, divisorStr] = question.split(':')
    return {
      dividend: Number.parseInt(dividendStr ?? '', 10) || 0,
      divisor: Number.parseInt(divisorStr ?? '', 10) || 0
    }
  }),
  getVirtualCardsForRange: vi.fn((_range: number[], cards: Card[]) => cards)
}))

vi.mock('@/services/storage', () => ({
  loadCards: storageMocks.loadCards,
  loadRange: storageMocks.loadRange,
  saveRange: storageMocks.saveRange,
  toggleFeature50: storageMocks.toggleFeature50,
  parseCardQuestion: storageMocks.parseCardQuestion,
  getVirtualCardsForRange: storageMocks.getVirtualCardsForRange
}))

// ---------------------------------------------------------------------------
// Game store mock
// ---------------------------------------------------------------------------

const gameStoreMocks = vi.hoisted(() => ({
  resetCards: vi.fn()
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: () => ({
    resetCards: gameStoreMocks.resetCards
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
      { path: '/', name: '/HomePage', component: { template: '<div>Home</div>' } },
      { path: '/cards', name: '/CardsManPage', component: { template: '<div>Cards</div>' } }
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
        CardsTimeHistogram: { template: '<div data-cy="time-histogram" />' },
        CardsListOfCards: { template: '<div data-cy="cards-list" />' }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('div CardsManPage', () => {
  const loadedCards: Card[] = [
    { question: '6:2', answer: 3, level: 1, time: 60 },
    { question: '12:3', answer: 4, level: 2, time: 45 }
  ]

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    storageMocks.loadRange.mockReturnValue([2, 3, 4, 5, 6, 7, 8, 9])
    storageMocks.loadCards.mockReturnValue(loadedCards)
  })

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('reset cards', () => {
    it('level distribution reset triggers showResetDialog', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()

      const vm = wrapper.vm as unknown as { resetCardsHandler: () => void }
      vm.resetCardsHandler()
      expect(resetCardsMocks.showResetDialog).toHaveBeenCalled()
    })

    it('showResetDialog callback calls resetCards and recomputes cards with reloaded data', async () => {
      let capturedCallback: (() => void) | undefined
      resetCardsMocks.showResetDialog.mockImplementation((cb: () => void) => {
        capturedCallback = cb
      })

      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await router.isReady()

      const vm = wrapper.vm as unknown as { resetCardsHandler: () => void }
      vm.resetCardsHandler()

      const resetCards: Card[] = [
        { question: '6:2', answer: 3, level: 1, time: 60 },
        { question: '12:3', answer: 4, level: 1, time: 60 }
      ]
      storageMocks.loadCards.mockReturnValue(resetCards)

      expect(capturedCallback).toBeDefined()
      capturedCallback?.()
      await nextTick()

      expect(gameStoreMocks.resetCards).toHaveBeenCalled()
      expect(storageMocks.loadCards).toHaveBeenCalled()
      expect(storageMocks.getVirtualCardsForRange).toHaveBeenLastCalledWith(
        [2, 3, 4, 5, 6, 7, 8, 9],
        resetCards
      )
    })
  })
})
