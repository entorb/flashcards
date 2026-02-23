import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import {
  quasarDirectives,
  quasarMocks,
  quasarProvide,
  quasarStubs
} from '@flashcards/shared/test-utils'
import { initializeCards } from '@/services/storage'
import type { GameHistory } from '@/types'
import HistoryPage from './HistoryPage.vue'

const storageMocks = vi.hoisted(() => ({
  loadHistory: vi.fn(() => [] as GameHistory[]),
  loadRange: vi.fn(() => [3, 4, 5, 6, 7, 8, 9]),
  initializeCards: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  loadHistory: storageMocks.loadHistory,
  loadRange: storageMocks.loadRange,
  initializeCards: storageMocks.initializeCards
}))

describe('1x1 HistoryPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/history', name: '/history', component: { template: '<div>History</div>' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      directives: quasarDirectives,
      stubs: {
        ...quasarStubs,
        AppFooter: { template: '<div />' }
      }
    }
  })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    initializeCards()
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders with empty history', async () => {
    storageMocks.loadHistory.mockReturnValue([])
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    // No history items rendered
    const items = wrapper
      .findAll('[data-cy^="history-game-"]')
      .filter(el => /^history-game-\d+$/.test(el.attributes('data-cy') ?? ''))
    expect(items).toHaveLength(0)
  })

  it('renders history entries', async () => {
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 42,
        correctAnswers: 8,
        settings: { select: [3, 4, 5], focus: 'weak' }
      },
      {
        date: '2024-01-14T09:00:00.000Z',
        points: 30,
        correctAnswers: 6,
        settings: { select: 'all', focus: 'medium' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    // Match only top-level items (not sub-elements like history-game-0-points)
    const items = wrapper
      .findAll('[data-cy^="history-game-"]')
      .filter(el => /^history-game-\d+$/.test(el.attributes('data-cy') ?? ''))
    expect(items).toHaveLength(2)
  })

  it('formatDetails formats array selection as comma-separated numbers', async () => {
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 42,
        correctAnswers: 8,
        settings: { select: [3, 4, 5], focus: 'weak' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    const entry = wrapper.find('[data-cy="history-game-0"]')
    expect(entry.text()).toContain('3, 4, 5')
  })

  it('formatDetails formats "all" selection as min-max range', async () => {
    storageMocks.loadRange.mockReturnValue([3, 4, 5, 6, 7, 8, 9])
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 42,
        correctAnswers: 8,
        settings: { select: 'all', focus: 'medium' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    const entry = wrapper.find('[data-cy="history-game-0"]')
    expect(entry.text()).toContain('3-9')
  })

  it('getPoints returns game points', async () => {
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 99,
        correctAnswers: 10,
        settings: { select: [3, 4], focus: 'strong' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-cy="history-game-0-points"]').text()).toContain('99')
  })

  it('getCorrectAnswers returns correct answers as string', async () => {
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 50,
        correctAnswers: 7,
        settings: { select: [5, 6], focus: 'slow' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-cy="history-game-0-correct"]').text()).toContain('7')
  })

  it('back button navigates to home', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await router.isReady()

    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Escape key navigates to home', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    mount(HistoryPage, createMountOptions(router))
    await router.isReady()

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await Promise.resolve()

    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('loads history and range on mount', async () => {
    const router = createMockRouter()
    mount(HistoryPage, createMountOptions(router))
    await router.isReady()

    expect(storageMocks.loadHistory).toHaveBeenCalled()
    expect(storageMocks.loadRange).toHaveBeenCalled()
  })
})
