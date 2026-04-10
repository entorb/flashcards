import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card } from '@/types'
import CardsManPage from './CardsManPage.vue'

const storageMocks = vi.hoisted(() => ({
  loadCards: vi.fn((): Card[] => [
    { question: '3+2', answer: 5, level: 1, time: 60 },
    { question: '15-8', answer: 7, level: 2, time: 45 }
  ]),
  parseCardQuestion: vi.fn((q: string) => {
    const plusIdx = q.indexOf('+')
    const minusIdx = q.indexOf('-')
    if (plusIdx !== -1) {
      return {
        x: Number.parseInt(q.slice(0, plusIdx), 10),
        operator: '+',
        y: Number.parseInt(q.slice(plusIdx + 1), 10)
      }
    }
    return {
      x: Number.parseInt(q.slice(0, minusIdx), 10),
      operator: '-',
      y: Number.parseInt(q.slice(minusIdx + 1), 10)
    }
  })
}))

vi.mock('@/services/storage', () => ({
  loadCards: storageMocks.loadCards,
  parseCardQuestion: storageMocks.parseCardQuestion
}))

vi.mock('@/services/cardSelector', () => ({
  filterCards: (cards: Card[]) => cards
}))

const gameStoreMocks = vi.hoisted(() => ({
  resetCards: vi.fn()
}))

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: () => ({
    resetCards: gameStoreMocks.resetCards
  })
}))

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

describe('pum CardsManPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        PumToggleButtons: {
          template: '<div data-cy="toggle-buttons" />',
          props: ['title', 'buttons', 'modelValue'],
          emits: ['update:modelValue']
        },
        CardsManLevelDistribution: { template: '<div data-cy="level-distribution" />' },
        CardsListOfCards: { template: '<div data-cy="cards-list" />' }
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
    const wrapper = mount(CardsManPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('loads cards on mount', async () => {
    const router = createMockRouter()
    mount(CardsManPage, createMountOptions(router))
    await router.isReady()
    expect(storageMocks.loadCards).toHaveBeenCalled()
  })

  it('renders back button', () => {
    const router = createMockRouter()
    const wrapper = mount(CardsManPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })

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

  it('removes keydown listener on unmount', async () => {
    const router = createMockRouter()
    vi.spyOn(router, 'push')
    const wrapper = mount(CardsManPage, createMountOptions(router))
    await router.isReady()
    wrapper.unmount()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await Promise.resolve()
    expect(router.push).not.toHaveBeenCalled()
  })
})
