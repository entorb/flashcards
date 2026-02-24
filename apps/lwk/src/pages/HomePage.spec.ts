import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HomePage from './HomePage.vue'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockCards = ref([{ word: 'Jahr', level: 1, time: 60 }])
const mockGameStats = ref({ points: 0, correctAnswers: 0, gamesPlayed: 0 })
const mockStartGame = vi.fn()
const mockSwitchDeck = vi.fn()
const mockGetDecks = vi.fn(() => [{ name: 'LWK_1', cards: mockCards.value }])

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameStats: mockGameStats,
    allCards: mockCards,
    startGame: mockStartGame,
    getDecks: mockGetDecks,
    switchDeck: mockSwitchDeck
  }))
}))

vi.mock('@/services/storage', () => ({
  loadSettings: vi.fn(() => null),
  saveSettings: vi.fn(),
  clearGameState: vi.fn(),
  clearGameConfig: vi.fn()
}))

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

const createMockRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: '/', component: { template: '<div />' } },
      { path: '/game', name: '/game', component: { template: '<div />' } },
      { path: '/history', name: '/history', component: { template: '<div />' } },
      { path: '/cards', name: '/cards', component: { template: '<div />' } },
      { path: '/info', name: '/info', component: { template: '<div />' } }
    ]
  })

// ---------------------------------------------------------------------------
// Mount options factory
// ---------------------------------------------------------------------------

const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
  global: {
    mocks: quasarMocks,
    plugins: [router],
    provide: quasarProvide,
    stubs: {
      ...quasarStubs,
      HomePageLayout: {
        template: `
          <div>
            <slot name="mascot" />
            <slot name="config" />
            <button data-cy="start-game-button" @click="$emit('startGame')">Start</button>
            <button data-cy="go-to-history-button" @click="$emit('goToHistory')">History</button>
            <button data-cy="go-to-cards-button" @click="$emit('goToCards')">Cards</button>
            <button data-cy="go-to-info-button" @click="$emit('goToInfo')">Info</button>
          </div>
        `,
        props: ['appTitle', 'basePath', 'statistics', 'disableStartButton'],
        emits: ['startGame', 'goToCards', 'goToHistory', 'goToInfo']
      },
      HomeFocusSelector: {
        template: '<div data-cy="focus-selector" />',
        props: ['modelValue', 'hideLabel'],
        emits: ['update:modelValue']
      },
      EisiMascot: { template: '<div data-cy="eisi-mascot" />', props: ['smile', 'size'] }
    }
  }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
    mockGameStats.value = { points: 0, correctAnswers: 0, gamesPlayed: 0 }
    mockGetDecks.mockReturnValue([{ name: 'LWK_1', cards: mockCards.value }])
  })

  // -------------------------------------------------------------------------
  // Mounting
  // -------------------------------------------------------------------------

  describe('mount', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the EisiMascot', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="eisi-mascot"]').exists()).toBe(true)
    })

    it('renders the focus selector', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="focus-selector"]').exists()).toBe(true)
    })

    it('renders the start game button', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="start-game-button"]').exists()).toBe(true)
    })

    it('renders the deck select element', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('select').exists()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  describe('navigation', () => {
    it('start game button navigates to /game', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/game' })
    })

    it('history button navigates to /history', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-history-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/history' })
    })

    it('cards button navigates to /cards', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-cards-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/cards' })
    })

    it('info button navigates to /info', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="go-to-info-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/info' })
    })
  })

  // -------------------------------------------------------------------------
  // Settings loading
  // -------------------------------------------------------------------------

  describe('settings loading', () => {
    it('uses default settings when none saved', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue(null)
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string; focus: string } }
      expect(vm.settings.mode).toBe('copy')
      expect(vm.settings.focus).toBe('weak')
    })

    it('loads saved settings on mount when deck is valid', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue({ mode: 'hidden', focus: 'strong', deck: 'LWK_1' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string; focus: string } }
      expect(vm.settings.mode).toBe('hidden')
      expect(vm.settings.focus).toBe('strong')
    })

    it('ignores saved settings when saved deck no longer exists', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue({ mode: 'hidden', focus: 'strong', deck: 'MISSING' })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { deck: string } }
      // Falls back to first available deck
      expect(vm.settings.deck).toBe('LWK_1')
    })
  })

  // -------------------------------------------------------------------------
  // Deck options
  // -------------------------------------------------------------------------

  describe('deck options', () => {
    it('populates deckOptions from getDecks() on mount', async () => {
      mockGetDecks.mockReturnValue([
        { name: 'LWK_1', cards: [] },
        { name: 'LWK_2', cards: [] }
      ])
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { deckOptions: { label: string; value: string }[] }
      expect(vm.deckOptions).toHaveLength(2)
      expect(vm.deckOptions[0]!.value).toBe('LWK_1')
      expect(vm.deckOptions[1]!.value).toBe('LWK_2')
    })

    it('handleDeckChange updates settings.deck', async () => {
      mockGetDecks.mockReturnValue([
        { name: 'LWK_1', cards: [] },
        { name: 'LWK_2', cards: [] }
      ])
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as {
        settings: { deck: string }
        handleDeckChange: (name: string) => void
      }
      vm.handleDeckChange('LWK_2')
      expect(vm.settings.deck).toBe('LWK_2')
    })
  })

  // -------------------------------------------------------------------------
  // Mode auto-switching
  // -------------------------------------------------------------------------

  describe('mode auto-switching', () => {
    it('hasLevel1Or2Cards is true when cards have level < 3', async () => {
      mockCards.value = [{ word: 'Jahr', level: 2, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { hasLevel1Or2Cards: boolean }
      expect(vm.hasLevel1Or2Cards).toBe(true)
    })

    it('hasLevel1Or2Cards is false when all cards are level 3+', async () => {
      mockCards.value = [{ word: 'Jahr', level: 3, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { hasLevel1Or2Cards: boolean }
      expect(vm.hasLevel1Or2Cards).toBe(false)
    })

    it('auto-switches from copy to hidden when no level 1/2 cards', async () => {
      mockCards.value = [{ word: 'Jahr', level: 3, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string } }
      // copy mode should have been switched to hidden automatically
      expect(vm.settings.mode).toBe('hidden')
    })

    it('keeps copy mode when level 1/2 cards exist', async () => {
      mockCards.value = [{ word: 'Jahr', level: 1, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string } }
      expect(vm.settings.mode).toBe('copy')
    })
  })

  // -------------------------------------------------------------------------
  // Start game action
  // -------------------------------------------------------------------------

  describe('startGame action', () => {
    it('calls clearGameState and clearGameConfig before starting', async () => {
      const { clearGameState, clearGameConfig } = await import('@/services/storage')
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(clearGameState).toHaveBeenCalled()
      expect(clearGameConfig).toHaveBeenCalled()
    })

    it('calls saveSettings with current settings on start', async () => {
      const { saveSettings } = await import('@/services/storage')
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(saveSettings).toHaveBeenCalled()
    })

    it('calls store startGame with current settings', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-game-button"]').trigger('click')
      expect(mockStartGame).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'copy', focus: 'weak' }),
        'standard'
      )
    })
  })
})
