import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS } from '../constants'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseGameHistory, DailyBonusConfig, GameResult } from '../types'
import GameOverPage from './GameOverPage.vue'

// Mock helperStatsDataWrite so it doesn't make real network calls
vi.mock('../utils/helper', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/helper')>()
  return {
    ...actual,
    helperStatsDataWrite: vi.fn(async () => Promise.resolve()),
    calculateDailyBonuses: actual.calculateDailyBonuses
  }
})

// Also mock via the index re-export path
vi.mock('../index', async importOriginal => {
  const actual = await importOriginal<typeof import('../index')>()
  return {
    ...actual,
    helperStatsDataWrite: vi.fn(async () => Promise.resolve())
  }
})

const createMockRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/game-over', component: { template: '<div />' } }
    ]
  })

const bonusConfig: DailyBonusConfig = {
  firstGameBonus: FIRST_GAME_BONUS,
  streakGameBonus: STREAK_GAME_BONUS,
  streakGameInterval: 5
}

interface TestHistory extends BaseGameHistory {
  totalCards: number
}

function makeStorageFunctions(gameResult: GameResult | null = null) {
  return {
    getGameResult: vi.fn(() => gameResult),
    clearGameResult: vi.fn(),
    clearGameState: vi.fn(),
    incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 2 })),
    saveGameStats: vi.fn(),
    saveHistory: vi.fn()
  }
}

function makeProps(
  storageFunctions: ReturnType<typeof makeStorageFunctions>,
  history: TestHistory[] = [],
  stats = { gamesPlayed: 1, points: 10, correctAnswers: 5 }
) {
  return {
    storageFunctions,
    bonusConfig,
    basePath: '1x1',
    gameStoreHistory: history,
    gameStoreStats: stats
  }
}

describe('GameOverPage (shared)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('renders final-points when valid game result exists', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 42, correctAnswers: 8, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-cy="final-points"]').exists()).toBe(true)
  })

  it('redirects to / when getGameResult returns null and history is empty', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const storageFunctions = makeStorageFunctions(null)

    mount(GameOverPage, {
      props: makeProps(storageFunctions, []),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('uses last history entry when getGameResult returns null', async () => {
    const router = createMockRouter()
    const storageFunctions = makeStorageFunctions(null)
    const history: TestHistory[] = [
      { date: '2024-01-01', points: 20, correctAnswers: 5, totalCards: 10 }
    ]

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions, history),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-cy="final-points"]').exists()).toBe(true)
  })

  it('calls saveHistory and saveGameStats on mount', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(storageFunctions.saveHistory).toHaveBeenCalled()
    expect(storageFunctions.saveGameStats).toHaveBeenCalled()
  })

  it('calls incrementDailyGames on mount when result exists', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(storageFunctions.incrementDailyGames).toHaveBeenCalled()
  })

  it('shows bonus chip when first game of day', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)
    storageFunctions.incrementDailyGames.mockReturnValue({ isFirstGame: true, gamesPlayedToday: 1 })

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    // Bonus section should be visible
    expect(wrapper.html()).toContain('bonus')
  })

  it('back-to-home button calls clearGameResult, clearGameState and navigates home', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-cy="back-to-home-button"]').trigger('click')

    expect(storageFunctions.clearGameResult).toHaveBeenCalled()
    expect(storageFunctions.clearGameState).toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Enter key triggers goHome', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('Escape key triggers goHome', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const result: GameResult = { points: 10, correctAnswers: 5, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('renders correct answers and total cards', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 30, correctAnswers: 7, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-cy="correct-answers-count"]').text()).toContain('7')
    expect(wrapper.find('[data-cy="total-questions-count"]').text()).toContain('10')
  })
})
