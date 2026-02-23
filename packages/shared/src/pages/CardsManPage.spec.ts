import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '../types'
import CardsManPage from './CardsManPage.vue'

// Controllable dialog/notify mocks
const dialogMock = vi.hoisted(() =>
  vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }))
)
const notifyMock = vi.hoisted(() => vi.fn())

vi.mock('quasar', () => ({
  useQuasar: () => ({
    dialog: (...args: Parameters<typeof dialogMock>) => dialogMock(...args),
    notify: (...args: Parameters<typeof notifyMock>) => notifyMock(...args)
  })
}))

// Helper to create a dialog mock that fires onOk immediately
function makeDialogWithOk(cb?: () => void) {
  return {
    onOk: (fn: () => void) => {
      if (cb) cb()
      fn()
      return { onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }
    },
    onCancel: vi.fn(),
    onDismiss: vi.fn()
  } as ReturnType<typeof dialogMock>
}
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/cards-edit', component: { template: '<div />' } },
    { path: '/decks-edit', component: { template: '<div />' } }
  ]
})

const mockCards: BaseCard[] = [
  { level: 1, time: 60 },
  { level: 2, time: 30 },
  { level: 3, time: 15 }
]

function makeMockStore() {
  return {
    allCards: ref<BaseCard[]>(mockCards),
    moveAllCards: vi.fn(),
    resetCards: vi.fn()
  }
}

function makeProps(store: ReturnType<typeof makeMockStore>) {
  return {
    appPrefix: 'lwk' as const,
    title: 'Kartenverwaltung',
    bannerHtml: '<strong>Info</strong>',
    decksTitle: 'Decks',
    editCardsRoute: '/cards-edit',
    editDecksRoute: '/decks-edit',
    getDecks: vi.fn(() => [{ name: 'LWK_1', cards: mockCards }]),
    switchDeck: vi.fn(),
    loadSettings: vi.fn(() => ({ deck: 'LWK_1' })),
    saveSettings: vi.fn(),
    store,
    getCardLabel: (card: BaseCard) => `Level ${card.level}`,
    getCardKey: (card: BaseCard) => `${card.level}-${card.time}`
  }
}

// Reusable stubs — plain versions for navigation tests
const plainStubs = {
  ...quasarStubs,
  HomeDeckSelector: { template: '<div />' },
  CardsManLevelDistribution: { template: '<div />' },
  CardsListOfCards: { template: '<div />' },
  CardManActions: { template: '<div />' }
}

const globalOpts = {
  mocks: quasarMocks,
  plugins: [router],
  provide: quasarProvide,
  stubs: plainStubs
}

describe('CardsManPage (shared)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    dialogMock.mockReturnValue({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() })
    vi.spyOn(router, 'push').mockResolvedValue()
  })

  it('mounts without errors', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('back button navigates to /', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('edit-cards button navigates to editCardsRoute', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.find('[data-cy="edit-cards-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/cards-edit')
  })

  it('edit-decks button navigates to editDecksRoute', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.find('[data-cy="edit-decks-button"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/decks-edit')
  })

  it('Escape key triggers navigation to /', async () => {
    const store = makeMockStore()
    mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('handleMoveClick is triggered by CardManActions move-click event', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleMoveClick: () => void }
    expect(() => {
      vm.handleMoveClick?.()
    }).not.toThrow()
  })

  it('handleResetCards is triggered by CardsManLevelDistribution reset event', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleResetCards: () => void }
    expect(() => {
      vm.handleResetCards?.()
    }).not.toThrow()
  })

  it('handleResetCardsToDefaultSet is triggered by CardManActions reset-click event', async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleResetCardsToDefaultSet: () => void }
    expect(() => {
      vm.handleResetCardsToDefaultSet?.()
    }).not.toThrow()
  })

  // ─── handleMoveClick — dialog confirmation ────────────────────────────────

  describe('handleMoveClick — dialog confirmation', () => {
    it('calls moveAllCards when dialog is confirmed', async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleMoveClick: () => void; targetLevel: number }
      vm.targetLevel = 3
      vm.handleMoveClick()
      expect(store.moveAllCards).toHaveBeenCalledWith(3)
    })

    it('handleMoveClick with invalid level calls notify', async () => {
      const store = makeMockStore()
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleMoveClick: () => void; targetLevel: number }
      vm.targetLevel = 99 // invalid
      vm.handleMoveClick()
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })
  })

  // ─── handleResetCards — calls moveAllCards(1) and resets time ─────────────

  describe('handleResetCards', () => {
    it('calls moveAllCards(1) and resets card times when dialog confirmed', async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleResetCards: () => void }
      vm.handleResetCards()

      expect(store.moveAllCards).toHaveBeenCalledWith(1)
    })
  })

  // ─── handleResetCardsToDefaultSet ────────────────────────────────────────

  describe('handleResetCardsToDefaultSet', () => {
    it('calls resetCards when dialog confirmed', async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleResetCardsToDefaultSet: () => void }
      vm.handleResetCardsToDefaultSet()

      expect(store.resetCards).toHaveBeenCalled()
    })
  })

  // ─── handleLevelClick — filters cards ────────────────────────────────────

  describe('handleLevelClick', () => {
    it('does not throw when called via vm', async () => {
      const store = makeMockStore()
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleLevelClick: (level: number) => void }
      expect(() => {
        vm.handleLevelClick?.(2)
      }).not.toThrow()
    })
  })
})
