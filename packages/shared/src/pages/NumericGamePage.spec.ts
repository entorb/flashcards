import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { NumericGameCard, NumericGameStore } from './NumericGamePage.vue'
import NumericGamePage from './NumericGamePage.vue'

const createMockRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/game', component: { template: '<div />' } }
    ]
  })

function createMockStore(
  cards: NumericGameCard[] = [
    { question: '3x4', answer: 12, level: 1, time: 0 },
    { question: '5x6', answer: 30, level: 2, time: 0 }
  ]
): NumericGameStore<NumericGameCard, unknown> {
  const gameCards = ref(cards)
  const currentCardIndex = ref(0)
  return {
    gameCards,
    currentCardIndex,
    points: ref(0),
    currentCard: ref(cards[0] ?? null),
    gameSettings: ref({ someOption: true }),
    sessionMode: ref('standard'),
    lastPointsBreakdown: ref(null),
    handleAnswer: vi.fn(),
    nextCard: vi.fn(() => true),
    finishGame: vi.fn(),
    discardGame: vi.fn()
  }
}

const formatQuestion = (q: string) => q.replace('x', ' × ')

describe('NumericGamePage (shared)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without errors when cards exist', async () => {
    const router = createMockRouter()
    await router.push('/game')
    await router.isReady()

    const wrapper = mount(NumericGamePage, {
      props: { store: createMockStore(), formatQuestion },
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: quasarStubs
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the formatted question', async () => {
    const router = createMockRouter()
    await router.push('/game')
    await router.isReady()

    const wrapper = mount(NumericGamePage, {
      props: { store: createMockStore(), formatQuestion },
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: quasarStubs
      }
    })
    expect(wrapper.text()).toContain('3 × 4')
  })

  it('redirects home when no cards and no settings', async () => {
    const router = createMockRouter()
    await router.push('/game')
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')

    const emptyStore = createMockStore([])
    emptyStore.gameSettings.value = null

    mount(NumericGamePage, {
      props: { store: emptyStore, formatQuestion },
      global: {
        mocks: quasarMocks,
        plugins: [router],
        provide: quasarProvide,
        stubs: quasarStubs
      }
    })

    expect(pushSpy).toHaveBeenCalledWith('/')
  })
})
