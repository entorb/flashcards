import type { SessionMode } from '@flashcards/shared'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card } from '@/types'
import GamePage from './GamePage.vue'

const mocks = vi.hoisted(() => ({
  handleAnswer: vi.fn(),
  nextCard: vi.fn(() => false),
  finishGame: vi.fn(),
  discardGame: vi.fn()
}))

const storeState = {
  gameCards: ref<Card[]>([]),
  currentCardIndex: ref(0),
  points: ref(0),
  currentCard: ref<Card | null>(null),
  gameSettings: ref<{ operations: string[]; difficulties: string[]; focus: string } | null>(null),
  lastPointsBreakdown: ref(null),
  sessionMode: ref<SessionMode>('standard')
}

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameCards: storeState.gameCards,
    currentCardIndex: storeState.currentCardIndex,
    points: storeState.points,
    currentCard: storeState.currentCard,
    gameSettings: storeState.gameSettings,
    sessionMode: storeState.sessionMode,
    handleAnswer: mocks.handleAnswer,
    nextCard: mocks.nextCard,
    finishGame: mocks.finishGame,
    discardGame: mocks.discardGame,
    lastPointsBreakdown: storeState.lastPointsBreakdown
  }))
}))

vi.mock('@/utils/questionFormatter', () => ({
  formatDisplayQuestion: vi.fn((q: string) => q.replace(/\+/g, ' + ').replace(/-/g, ' - '))
}))

const NumericGamePageStub = {
  name: 'NumericGamePage',
  template: '<div data-cy="numeric-game-page" />',
  props: ['store', 'formatQuestion']
}

describe('pum GamePage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/game', name: '/game', component: { template: '<div />' } },
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
        NumericGamePage: NumericGamePageStub
      }
    }
  })

  const withCard = () => {
    const card: Card = { question: '7+3', answer: 10, level: 1, time: 60 }
    storeState.currentCard.value = card
    storeState.gameCards.value = [card]
    storeState.gameSettings.value = {
      operations: ['plus'],
      difficulties: ['simple'],
      focus: 'weak'
    }
    storeState.currentCardIndex.value = 0
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    storeState.currentCard.value = null
    storeState.gameCards.value = []
    storeState.gameSettings.value = null
    storeState.currentCardIndex.value = 0
    storeState.points.value = 0
    storeState.lastPointsBreakdown.value = null
    storeState.sessionMode.value = 'standard'
    mocks.nextCard.mockReturnValue(false)
  })

  it('mounts with valid game state and renders without errors', async () => {
    withCard()
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the NumericGamePage component', async () => {
    withCard()
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="numeric-game-page"]').exists()).toBe(true)
  })

  it('passes store to NumericGamePage', async () => {
    withCard()
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const ngp = wrapper.findComponent(NumericGamePageStub)
    expect(ngp.props('store')).toBeDefined()
  })

  it('passes formatQuestion to NumericGamePage', async () => {
    withCard()
    const router = createMockRouter()
    const wrapper = mount(GamePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const ngp = wrapper.findComponent(NumericGamePageStub)
    const formatQuestion = ngp.props('formatQuestion') as (q: string) => string
    expect(typeof formatQuestion).toBe('function')
    expect(formatQuestion('7+3')).toBe('7 + 3')
  })
})
