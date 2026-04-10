import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import GameOverPage from './GameOverPage.vue'

const { SharedGameOverPageStub } = vi.hoisted(() => ({
  SharedGameOverPageStub: {
    name: 'GameOverPage',
    template: `<div data-cy="shared-game-over-page">
      <slot name="mascot" :is-happy="true" :is-grinning="false" />
    </div>`,
    props: ['storageFunctions', 'bonusConfig', 'basePath', 'gameStoreHistory', 'gameStoreStats']
  }
}))

vi.mock('@flashcards/shared/pages', () => ({
  GameOverPage: SharedGameOverPageStub
}))

const storageMocks = vi.hoisted(() => ({
  getGameResult: vi.fn(() => null),
  clearGameResult: vi.fn(),
  clearGameState: vi.fn(),
  incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 })),
  saveGameStats: vi.fn(),
  saveHistory: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  getGameResult: storageMocks.getGameResult,
  clearGameResult: storageMocks.clearGameResult,
  clearGameState: storageMocks.clearGameState,
  incrementDailyGames: storageMocks.incrementDailyGames,
  saveGameStats: storageMocks.saveGameStats,
  saveHistory: storageMocks.saveHistory
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    history: { value: [] },
    gameStats: { value: { points: 0, correctAnswers: 0, gamesPlayed: 0 } }
  }))
}))

describe('pum GameOverPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/game-over', name: '/game-over', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        RaccoonMascot: {
          template: '<div data-cy="raccoon-mascot" />',
          props: ['smile', 'grin', 'size']
        }
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
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the shared GameOverPage component', async () => {
    const router = createMockRouter()
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="shared-game-over-page"]').exists()).toBe(true)
  })

  it('passes storageFunctions to shared GameOverPage', async () => {
    const router = createMockRouter()
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
    const fns = sharedPage.props('storageFunctions') as Record<string, unknown>
    expect(typeof fns['getGameResult']).toBe('function')
    expect(typeof fns['clearGameResult']).toBe('function')
    expect(typeof fns['clearGameState']).toBe('function')
    expect(typeof fns['incrementDailyGames']).toBe('function')
    expect(typeof fns['saveGameStats']).toBe('function')
    expect(typeof fns['saveHistory']).toBe('function')
  })

  it('passes bonusConfig to shared GameOverPage', async () => {
    const router = createMockRouter()
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const sharedPage = wrapper.findComponent(SharedGameOverPageStub)
    const cfg = sharedPage.props('bonusConfig') as Record<string, unknown>
    expect(typeof cfg['firstGameBonus']).toBe('number')
    expect(typeof cfg['streakGameBonus']).toBe('number')
    expect(typeof cfg['streakGameInterval']).toBe('number')
  })

  it('renders RaccoonMascot in the mascot slot', async () => {
    const router = createMockRouter()
    const wrapper = mount(GameOverPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="raccoon-mascot"]').exists()).toBe(true)
  })
})
