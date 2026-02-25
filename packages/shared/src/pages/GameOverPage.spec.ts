import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fc from 'fast-check'
import { createMemoryHistory, createRouter } from 'vue-router'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS } from '../constants'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseGameHistory, DailyBonusConfig, GameResult } from '../types'
import { calculateDailyBonuses } from '../utils/helper'
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

// Feature: game-points-early-persist, Property 5: GameOverPage total equals session points plus bonus points
/**
 * **Validates: Requirements 5.1**
 * For any GameResult with random points and any set of daily bonuses,
 * the totalPoints computed on the GameOverPage equals result.points + sum(bonusReasons.points).
 */
describe('GameOverPage — total equals session points plus bonus points (Property 5)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  const dailyInfoArb = fc.record({
    isFirstGame: fc.boolean(),
    gamesPlayedToday: fc.integer({ min: 1, max: 50 })
  })

  const bonusConfigArb: fc.Arbitrary<DailyBonusConfig> = fc.record({
    firstGameBonus: fc.integer({ min: 0, max: 50 }),
    streakGameBonus: fc.integer({ min: 0, max: 50 }),
    streakGameInterval: fc.integer({ min: 1, max: 10 })
  })

  const gameResultArb: fc.Arbitrary<GameResult> = fc.record({
    points: fc.integer({ min: 0, max: 10_000 }),
    correctAnswers: fc.integer({ min: 0, max: 100 }),
    totalCards: fc.integer({ min: 1, max: 100 })
  })

  it('totalPoints displayed by component matches session points plus bonus points', async () => {
    await fc.assert(
      fc.asyncProperty(
        gameResultArb,
        dailyInfoArb,
        bonusConfigArb,
        async (gameResult, dailyInfo, config) => {
          const bonuses = calculateDailyBonuses(dailyInfo, config)
          let expectedBonusSum = 0
          for (const bonus of bonuses) {
            expectedBonusSum += bonus.points
          }
          const expectedTotal = gameResult.points + expectedBonusSum

          const router = createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: '/', component: { template: '<div />' } },
              { path: '/game-over', component: { template: '<div />' } }
            ]
          })

          const storageFunctions = {
            getGameResult: vi.fn(() => gameResult),
            clearGameResult: vi.fn(),
            clearGameState: vi.fn(),
            incrementDailyGames: vi.fn(() => dailyInfo),
            saveGameStats: vi.fn(),
            saveHistory: vi.fn()
          }

          const wrapper = mount(GameOverPage, {
            props: {
              storageFunctions,
              bonusConfig: config,
              basePath: '1x1',
              gameStoreHistory: [] as Array<BaseGameHistory & { totalCards: number }>,
              gameStoreStats: { gamesPlayed: 1, points: 100, correctAnswers: 50 }
            },
            global: {
              mocks: quasarMocks,
              plugins: [router],
              provide: quasarProvide,
              stubs: { ...quasarStubs }
            }
          })

          // Wait for onMounted to complete
          await new Promise(resolve => setTimeout(resolve, 0))
          await wrapper.vm.$nextTick()

          const finalPointsEl = wrapper.find('[data-cy="final-points"]')
          expect(finalPointsEl.exists()).toBe(true)
          expect(finalPointsEl.text()).toBe(String(expectedTotal))

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: game-points-early-persist, Property 6: GameOverPage persists gamesPlayed increment and bonus points
/**
 * **Validates: Requirements 2.3, 2.4**
 * For any completed game, after GameOverPage processing, saveGameStats is called
 * with gamesPlayed incremented by 1 (compared to pre-game value) and points
 * that include the bonus points added by the GameOverPage.
 */
describe('GameOverPage — persists gamesPlayed increment and bonus points (Property 6)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  const dailyInfoArb = fc.record({
    isFirstGame: fc.boolean(),
    gamesPlayedToday: fc.integer({ min: 1, max: 50 })
  })

  const bonusConfigArb: fc.Arbitrary<DailyBonusConfig> = fc.record({
    firstGameBonus: fc.integer({ min: 0, max: 50 }),
    streakGameBonus: fc.integer({ min: 0, max: 50 }),
    streakGameInterval: fc.integer({ min: 1, max: 10 })
  })

  const gameResultArb: fc.Arbitrary<GameResult> = fc.record({
    points: fc.integer({ min: 0, max: 10_000 }),
    correctAnswers: fc.integer({ min: 0, max: 100 }),
    totalCards: fc.integer({ min: 1, max: 100 })
  })

  const preGameStatsArb = fc.record({
    gamesPlayed: fc.integer({ min: 0, max: 1000 }),
    points: fc.integer({ min: 0, max: 100_000 }),
    correctAnswers: fc.integer({ min: 0, max: 10_000 })
  })

  it('saveGameStats receives gamesPlayed incremented by 1 and points including bonus', async () => {
    await fc.assert(
      fc.asyncProperty(
        gameResultArb,
        dailyInfoArb,
        bonusConfigArb,
        preGameStatsArb,
        async (gameResult, dailyInfo, config, preGameStats) => {
          // Simulate what finishGame/saveGameResults does: increment gamesPlayed by 1
          const statsAfterFinish = {
            gamesPlayed: preGameStats.gamesPlayed + 1,
            points: preGameStats.points,
            correctAnswers: preGameStats.correctAnswers
          }

          const bonuses = calculateDailyBonuses(dailyInfo, config)
          let expectedBonusSum = 0
          for (const bonus of bonuses) {
            expectedBonusSum += bonus.points
          }

          const router = createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: '/', component: { template: '<div />' } },
              { path: '/game-over', component: { template: '<div />' } }
            ]
          })

          const storageFunctions = {
            getGameResult: vi.fn(() => gameResult),
            clearGameResult: vi.fn(),
            clearGameState: vi.fn(),
            incrementDailyGames: vi.fn(() => dailyInfo),
            saveGameStats: vi.fn(),
            saveHistory: vi.fn()
          }

          const wrapper = mount(GameOverPage, {
            props: {
              storageFunctions,
              bonusConfig: config,
              basePath: '1x1',
              gameStoreHistory: [] as Array<BaseGameHistory & { totalCards: number }>,
              gameStoreStats: statsAfterFinish
            },
            global: {
              mocks: quasarMocks,
              plugins: [router],
              provide: quasarProvide,
              stubs: { ...quasarStubs }
            }
          })

          // Wait for onMounted to complete
          await new Promise(resolve => setTimeout(resolve, 0))
          await wrapper.vm.$nextTick()

          // Verify saveGameStats was called
          expect(storageFunctions.saveGameStats).toHaveBeenCalledOnce()

          const savedStats = storageFunctions.saveGameStats.mock.calls[0]?.[0] as {
            gamesPlayed: number
            points: number
            correctAnswers: number
          }
          expect(savedStats.gamesPlayed).toBe(preGameStats.gamesPlayed + 1)

          // points should include the bonus points added by GameOverPage
          expect(savedStats.points).toBe(preGameStats.points + expectedBonusSum)

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: game-points-early-persist
/**
 * Unit test: zero bonus points edge case
 * When bonus points are zero, gamesPlayed still increments.
 * _Requirements: 2.4_
 */
describe('GameOverPage — zero bonus points edge case', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('gamesPlayed increments and points stay unchanged when no bonuses are earned', async () => {
    const router = createMockRouter()
    const result: GameResult = { points: 55, correctAnswers: 6, totalCards: 10 }
    const storageFunctions = makeStorageFunctions(result)
    // Not first game, gamesPlayedToday=2 is not a multiple of streakGameInterval(5) → zero bonuses
    storageFunctions.incrementDailyGames.mockReturnValue({
      isFirstGame: false,
      gamesPlayedToday: 2
    })

    const initialPoints = 200
    const initialGamesPlayed = 7

    const wrapper = mount(GameOverPage, {
      props: makeProps(storageFunctions, [], {
        gamesPlayed: initialGamesPlayed,
        points: initialPoints,
        correctAnswers: 30
      }),
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: { ...quasarStubs }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(storageFunctions.saveGameStats).toHaveBeenCalledOnce()

    const savedStats = storageFunctions.saveGameStats.mock.calls[0]?.[0] as {
      gamesPlayed: number
      points: number
      correctAnswers: number
    }

    // gamesPlayed was already incremented by finishGame before reaching GameOverPage,
    // so the saved value should match what was passed in
    expect(savedStats.gamesPlayed).toBe(initialGamesPlayed)
    // Points unchanged — no bonus added
    expect(savedStats.points).toBe(initialPoints)

    wrapper.unmount()
  })
})
