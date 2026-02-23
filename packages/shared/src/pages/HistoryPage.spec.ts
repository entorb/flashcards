import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseGameHistory } from '../types'
import HistoryPage from './HistoryPage.vue'

interface TestHistory extends BaseGameHistory {
  totalCards: number
}

const createMockRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })

const formatDetails = vi.fn((item: BaseGameHistory) => {
  const h = item as TestHistory
  return `${h.correctAnswers}/${h.totalCards}`
})
const getPoints = vi.fn((item: BaseGameHistory) => item.points)
const getCorrectAnswers = vi.fn((item: BaseGameHistory) => {
  const h = item as TestHistory
  return `${h.correctAnswers}/${h.totalCards}`
})

const mountOptions = (router: ReturnType<typeof createMockRouter>) => ({
  global: {
    mocks: quasarMocks,
    plugins: [router],
    provide: quasarProvide,
    stubs: quasarStubs,
    directives: { ripple: {} }
  }
})

describe('HistoryPage (shared)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('mounts without errors with empty history', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, {
      props: {
        history: [] as TestHistory[],
        formatDetails,
        getPoints,
        getCorrectAnswers
      },
      ...mountOptions(router)
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders empty list when history is empty', async () => {
    const router = createMockRouter()
    const wrapper = mount(HistoryPage, {
      props: {
        history: [] as TestHistory[],
        formatDetails,
        getPoints,
        getCorrectAnswers
      },
      ...mountOptions(router)
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-cy^="history-game-"]')).toHaveLength(0)
  })

  it('renders 3 history entries', async () => {
    const router = createMockRouter()
    const history: TestHistory[] = [
      { date: '2024-01-01T10:00:00', points: 10, correctAnswers: 5, totalCards: 10 },
      { date: '2024-01-02T10:00:00', points: 20, correctAnswers: 8, totalCards: 10 },
      { date: '2024-01-03T10:00:00', points: 30, correctAnswers: 9, totalCards: 10 }
    ]
    const wrapper = mount(HistoryPage, {
      props: { history, formatDetails, getPoints, getCorrectAnswers },
      ...mountOptions(router)
    })
    await wrapper.vm.$nextTick()
    // Match only the row items (data-cy="history-game-0", "history-game-1", etc.)
    // not sub-elements like "history-game-0-points"
    const items = wrapper
      .findAll('[data-cy]')
      .filter(el => /^history-game-\d+$/.test(el.attributes('data-cy') ?? ''))
    expect(items).toHaveLength(3)
  })

  it('entries are sorted newest-first', async () => {
    const router = createMockRouter()
    const history: TestHistory[] = [
      { date: '2024-01-01T10:00:00', points: 10, correctAnswers: 5, totalCards: 10 },
      { date: '2024-01-03T10:00:00', points: 30, correctAnswers: 9, totalCards: 10 },
      { date: '2024-01-02T10:00:00', points: 20, correctAnswers: 8, totalCards: 10 }
    ]
    const wrapper = mount(HistoryPage, {
      props: { history, formatDetails, getPoints, getCorrectAnswers },
      ...mountOptions(router)
    })
    await wrapper.vm.$nextTick()

    // First item should be the newest (2024-01-03, points=30)
    const firstPoints = wrapper.find('[data-cy="history-game-0-points"]')
    expect(firstPoints.text()).toContain('30')
  })

  it('formatDetails prop is called for each entry', async () => {
    const router = createMockRouter()
    const localFormatDetails = vi.fn((item: BaseGameHistory) => `details-${item.points}`)
    const history: TestHistory[] = [
      { date: '2024-01-01T10:00:00', points: 10, correctAnswers: 5, totalCards: 10 },
      { date: '2024-01-02T10:00:00', points: 20, correctAnswers: 8, totalCards: 10 }
    ]
    mount(HistoryPage, {
      props: { history, formatDetails: localFormatDetails, getPoints, getCorrectAnswers },
      ...mountOptions(router)
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(localFormatDetails).toHaveBeenCalledTimes(2)
  })

  it('getPoints prop is called for each entry', async () => {
    const router = createMockRouter()
    const localGetPoints = vi.fn((item: BaseGameHistory) => item.points)
    const history: TestHistory[] = [
      { date: '2024-01-01T10:00:00', points: 10, correctAnswers: 5, totalCards: 10 },
      { date: '2024-01-02T10:00:00', points: 20, correctAnswers: 8, totalCards: 10 }
    ]
    mount(HistoryPage, {
      props: { history, formatDetails, getPoints: localGetPoints, getCorrectAnswers },
      ...mountOptions(router)
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(localGetPoints).toHaveBeenCalledTimes(2)
  })

  it('back button navigates to /', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const wrapper = mount(HistoryPage, {
      props: {
        history: [] as TestHistory[],
        formatDetails,
        getPoints,
        getCorrectAnswers
      },
      ...mountOptions(router)
    })
    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Escape key navigates to /', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    mount(HistoryPage, {
      props: {
        history: [] as TestHistory[],
        formatDetails,
        getPoints,
        getCorrectAnswers
      },
      ...mountOptions(router)
    })
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('renders points for each history entry', async () => {
    const router = createMockRouter()
    const history: TestHistory[] = [
      { date: '2024-01-02T10:00:00', points: 99, correctAnswers: 10, totalCards: 10 }
    ]
    const wrapper = mount(HistoryPage, {
      props: { history, formatDetails, getPoints, getCorrectAnswers },
      ...mountOptions(router)
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="history-game-0-points"]').text()).toContain('99')
  })
})
