import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '@flashcards/shared'
import CardsManPage from './CardsManPage.vue'

// ---------------------------------------------------------------------------
// Stub the shared CardsManPage component
// ---------------------------------------------------------------------------

const { SharedCardsManPageStub } = vi.hoisted(() => ({
  SharedCardsManPageStub: {
    name: 'CardsManPage',
    template: `<div data-cy="shared-cards-man-page">
      <button data-cy="back-button" @click="$emit('back')" />
      <button data-cy="edit-cards-button" @click="$emit('editCards')" />
      <button data-cy="edit-decks-button" @click="$emit('editDecks')" />
    </div>`,
    props: [
      'appPrefix',
      'title',
      'bannerHtml',
      'decksTitle',
      'editCardsRoute',
      'editDecksRoute',
      'getDecks',
      'switchDeck',
      'loadSettings',
      'saveSettings',
      'store',
      'getCardLabel',
      'getCardKey'
    ],
    emits: ['back', 'editCards', 'editDecks']
  }
}))

vi.mock('@flashcards/shared/components', () => ({
  CardsManPage: SharedCardsManPageStub
}))

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockAllCards = ref<BaseCard[]>([{ level: 1, time: 60 } as BaseCard])
const mockMoveAllCards = vi.fn()
const mockResetCards = vi.fn()
const mockGetDecks = vi.fn(() => [{ name: 'LWK_1', cards: mockAllCards.value }])
const mockSwitchDeck = vi.fn()

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    allCards: mockAllCards,
    moveAllCards: mockMoveAllCards,
    resetCards: mockResetCards,
    getDecks: mockGetDecks,
    switchDeck: mockSwitchDeck
  }))
}))

vi.mock('@/services/storage', () => ({
  loadSettings: vi.fn(() => null),
  saveSettings: vi.fn()
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk CardsManPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } },
        { path: '/cards-edit', name: '/cards-edit', component: { template: '<div />' } },
        { path: '/decks', name: '/decks', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: { ...quasarStubs }
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockAllCards.value = [{ level: 1, time: 60 } as BaseCard]
    mockGetDecks.mockReturnValue([{ name: 'LWK_1', cards: mockAllCards.value }])
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the shared CardsManPage component', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="shared-cards-man-page"]').exists()).toBe(true)
    })
  })

  // ─── Props ────────────────────────────────────────────────────────────────

  describe('props passed to shared CardsManPage', () => {
    it('passes appPrefix="lwk"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props('appPrefix')).toBe('lwk')
    })

    it('passes editCardsRoute="/cards-edit"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props('editCardsRoute')).toBe('/cards-edit')
    })

    it('passes editDecksRoute="/decks"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props('editDecksRoute')).toBe('/decks')
    })

    it('passes store with allCards, moveAllCards, resetCards', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const store = shared.props('store') as {
        allCards: typeof mockAllCards
        moveAllCards: typeof mockMoveAllCards
        resetCards: typeof mockResetCards
      }
      expect(store.allCards).toBe(mockAllCards)
      expect(typeof store.moveAllCards).toBe('function')
      expect(typeof store.resetCards).toBe('function')
    })

    it('passes getDecks function that returns decks', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getDecks = shared.props('getDecks') as () => { name: string }[]
      expect(typeof getDecks).toBe('function')
      expect(getDecks()[0]!.name).toBe('LWK_1')
    })

    it('passes switchDeck function that delegates to store', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const switchDeck = shared.props('switchDeck') as (name: string) => void
      switchDeck('LWK_2')
      expect(mockSwitchDeck).toHaveBeenCalledWith('LWK_2')
    })

    it('passes loadSettings and saveSettings functions', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props('loadSettings')).toBe('function')
      expect(typeof shared.props('saveSettings')).toBe('function')
    })

    it('passes getCardLabel function', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props('getCardLabel')).toBe('function')
    })

    it('passes getCardKey function', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props('getCardKey')).toBe('function')
    })
  })

  // ─── getCardLabel (lwk-specific) ──────────────────────────────────────────

  describe('getCardLabel (lwk-specific)', () => {
    it('returns the word field as label', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardLabel = shared.props('getCardLabel') as (card: BaseCard) => string
      const card = { word: 'Jahr', level: 1, time: 60 } as unknown as BaseCard
      expect(getCardLabel(card)).toBe('Jahr')
    })
  })

  // ─── getCardKey (lwk-specific) ────────────────────────────────────────────

  describe('getCardKey (lwk-specific)', () => {
    it('returns the word field as key', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardKey = shared.props('getCardKey') as (card: BaseCard) => string
      const card = { word: 'bleiben', level: 2, time: 45 } as unknown as BaseCard
      expect(getCardKey(card)).toBe('bleiben')
    })
  })
})
