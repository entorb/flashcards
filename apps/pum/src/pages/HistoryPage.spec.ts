import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameHistory } from '@/types'
import HistoryPage from './HistoryPage.vue'

const storageMocks = vi.hoisted(() => ({
  loadHistory: vi.fn((): GameHistory[] => [])
}))

vi.mock('@/services/storage', () => ({
  loadHistory: storageMocks.loadHistory
}))

describe('pum HistoryPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/history', name: '/history', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
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
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('loads history on mount', async () => {
    const router = createMockRouter()
    mount(HistoryPage, createMountOptions(router))
    await router.isReady()
    expect(storageMocks.loadHistory).toHaveBeenCalled()
  })

  it('renders with empty history', async () => {
    storageMocks.loadHistory.mockReturnValue([])
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
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
        settings: { operations: ['plus'], difficulties: ['simple'], focus: 'weak' }
      },
      {
        date: '2024-01-14T09:00:00.000Z',
        points: 30,
        correctAnswers: 6,
        settings: { operations: ['minus'], difficulties: ['medium'], focus: 'medium' }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    const items = wrapper
      .findAll('[data-cy^="history-game-"]')
      .filter(el => /^history-game-\d+$/.test(el.attributes('data-cy') ?? ''))
    expect(items).toHaveLength(2)
  })

  it('formatDetails shows operations, difficulties, and focus', async () => {
    const mockHistory: GameHistory[] = [
      {
        date: '2024-01-15T10:00:00.000Z',
        points: 42,
        correctAnswers: 8,
        settings: {
          operations: ['plus', 'minus'],
          difficulties: ['simple', 'advanced'],
          focus: 'weak'
        }
      }
    ]
    storageMocks.loadHistory.mockReturnValue(mockHistory)

    const router = createMockRouter()
    const wrapper = mount(HistoryPage, createMountOptions(router))
    await wrapper.vm.$nextTick()

    const entry = wrapper.find('[data-cy="history-game-0"]')
    const text = entry.text()
    // Should contain operation labels separated by pipe
    expect(text).toContain('|')
  })
})
