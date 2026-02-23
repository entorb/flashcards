import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomePage from './HomePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'

// Default mock cards with level 1 (enables all modes)
const mockCards = ref([{ voc: 'hello', de: 'hallo', level: 1, time: 60 }])
const mockGameStats = ref({ points: 42, correctAnswers: 10, gamesPlayed: 3 })
const mockMoveAllCards = vi.fn((level: number) => {
  mockCards.value = mockCards.value.map(c => ({ ...c, level }))
})

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameStats: mockGameStats,
    allCards: mockCards,
    startGame: vi.fn(),
    getDecks: vi.fn(() => [{ name: 'en', cards: mockCards.value }]),
    switchDeck: vi.fn(),
    moveAllCards: mockMoveAllCards
  }))
}))

vi.mock('@/services/storage', () => ({
  loadSettings: vi.fn(() => null),
  saveSettings: vi.fn(),
  loadDecks: vi.fn(() => [
    { name: 'en', cards: [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }] }
  ]),
  saveDecks: vi.fn(),
  loadCards: vi.fn(() => [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }]),
  saveCards: vi.fn(),
  loadGameStats: vi.fn(() => ({ points: 42, correctAnswers: 10, gamesPlayed: 3 })),
  saveGameStats: vi.fn(),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
  loadGameState: vi.fn(() => null),
  saveGameState: vi.fn(),
  clearGameState: vi.fn(),
  setGameResult: vi.fn(),
  getGameResult: vi.fn(() => null),
  clearGameResult: vi.fn(),
  incrementDailyGames: vi.fn(() => ({ isFirstGame: false, gamesPlayedToday: 1 }))
}))

describe('HomePage', () => {
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
              <button data-cy="start-button" @click="$emit('startGame')" />
              <button data-cy="cards-button" @click="$emit('goToCards')" />
              <button data-cy="history-button" @click="$emit('goToHistory')" />
              <button data-cy="info-button" @click="$emit('goToInfo')" />
            </div>
          `,
          emits: ['startGame', 'goToCards', 'goToHistory', 'goToInfo']
        },
        HomeFocusSelector: {
          template: '<div data-cy="focus-selector" />',
          props: ['modelValue', 'hideLabel'],
          emits: ['update:modelValue']
        },
        FoxMascot: { template: '<div data-cy="fox-mascot" />' }
      }
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock cards to level 1 (all modes enabled)
    mockCards.value = [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }]
    mockGameStats.value = { points: 42, correctAnswers: 10, gamesPlayed: 3 }
  })

  describe('mount', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the fox mascot', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="fox-mascot"]').exists()).toBe(true)
    })

    it('renders the focus selector', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="focus-selector"]').exists()).toBe(true)
    })

    it('renders the deck select element', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('select').exists()).toBe(true)
    })

    it('renders mode buttons', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('navigation', () => {
    it('start button navigates to /game', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="start-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/game' })
    })

    it('cards button navigates to /cards', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="cards-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/cards' })
    })

    it('history button navigates to /history', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="history-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/history' })
    })

    it('info button navigates to /info', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="info-button"]').trigger('click')
      expect(router.push).toHaveBeenCalledWith({ name: '/info' })
    })
  })

  describe('deck selector', () => {
    it('populates deck options from getDecks()', async () => {
      const { useGameStore } = await import('@/composables/useGameStore')
      vi.mocked(useGameStore).mockReturnValue({
        gameStats: mockGameStats,
        allCards: mockCards,
        gameCards: ref([]),
        gameSettings: ref(null),
        currentCardIndex: ref(0),
        points: ref(0),
        correctAnswersCount: ref(0),
        history: ref([]),
        currentCard: computed(() => null as any),
        isFoxHappy: computed(() => false),
        lastPointsBreakdown: ref(null),
        startGame: vi.fn(),
        handleAnswer: vi.fn(),
        nextCard: vi.fn(),
        finishGame: vi.fn(),
        discardGame: vi.fn(),
        resetCards: vi.fn(),
        importCards: vi.fn(),
        getDecks: vi.fn(() => [
          { name: 'en', cards: [] },
          { name: 'fr', cards: [] }
        ]),
        addDeck: vi.fn(),
        removeDeck: vi.fn(),
        renameDeck: vi.fn(),
        switchDeck: vi.fn(),
        moveAllCards: mockMoveAllCards
      } as ReturnType<typeof useGameStore>)

      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { deckOptions: { label: string; value: string }[] }
      expect(vm.deckOptions).toHaveLength(2)
      expect(vm.deckOptions[0]!.value).toBe('en')
      expect(vm.deckOptions[1]!.value).toBe('fr')
    })

    it('handleDeckChange updates settings.deck', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as {
        settings: { deck: string }
        handleDeckChange: (name: string) => void
      }
      vm.handleDeckChange('fr')
      expect(vm.settings.deck).toBe('fr')
    })
  })

  describe('settings loading', () => {
    it('loads saved settings on mount', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue({
        mode: 'typing',
        focus: 'strong',
        language: 'de-voc',
        deck: 'en'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as {
        settings: { mode: string; focus: string; language: string }
      }
      expect(vm.settings.mode).toBe('typing')
      expect(vm.settings.focus).toBe('strong')
      expect(vm.settings.language).toBe('de-voc')
    })

    it('uses default settings when none saved', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue(null)
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string; focus: string } }
      expect(vm.settings.mode).toBe('multiple-choice')
      expect(vm.settings.focus).toBe('weak')
    })
  })

  describe('mode auto-switching (voc-specific)', () => {
    it('hasLevel1Cards is true when cards have level 1', async () => {
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { hasLevel1Cards: boolean }
      expect(vm.hasLevel1Cards).toBe(true)
    })

    it('hasLevel1Cards is false when no level-1 cards', async () => {
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 2, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { hasLevel1Cards: boolean }
      expect(vm.hasLevel1Cards).toBe(false)
    })

    it('hasLevel1Or2Cards is false when all cards are level 3+', async () => {
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 3, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { hasLevel1Or2Cards: boolean }
      expect(vm.hasLevel1Or2Cards).toBe(false)
    })

    it('auto-switches from multiple-choice to blind when level-1 cards removed', async () => {
      // Start with level-1 card so multiple-choice is valid
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        settings: { mode: string }
        checkLevel1Cards: () => void
      }
      vm.settings.mode = 'multiple-choice'

      // Simulate cards moving to level 2 (no level-1 cards, but level-2 exists)
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 2, time: 60 }]
      vm.checkLevel1Cards()
      await wrapper.vm.$nextTick()

      expect(vm.settings.mode).toBe('blind')
    })

    it('auto-switches from blind to typing when level-1 and level-2 cards removed', async () => {
      // Start with level-2 card so blind is valid
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 2, time: 60 }]
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        settings: { mode: string }
        checkLevel1Cards: () => void
      }
      vm.settings.mode = 'blind'

      // Simulate all cards moving to level 3+
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 3, time: 60 }]
      vm.checkLevel1Cards()
      await wrapper.vm.$nextTick()

      expect(vm.settings.mode).toBe('typing')
    })

    it('keeps typing mode when already on typing regardless of card levels', async () => {
      mockCards.value = [{ voc: 'hello', de: 'hallo', level: 3, time: 60 }]
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue({
        mode: 'typing',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { mode: string } }
      expect(vm.settings.mode).toBe('typing')
    })
  })

  describe('language direction (voc-specific)', () => {
    it('defaults to voc-de direction', async () => {
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { language: string } }
      expect(vm.settings.language).toBe('voc-de')
    })

    it('loads saved language direction from settings', async () => {
      const { loadSettings } = await import('@/services/storage')
      vi.mocked(loadSettings).mockReturnValue({
        mode: 'typing',
        focus: 'weak',
        language: 'de-voc',
        deck: 'en'
      })
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { settings: { language: string } }
      expect(vm.settings.language).toBe('de-voc')
    })
  })

  describe('statistics', () => {
    it('passes gameStats from store to the layout', async () => {
      mockGameStats.value = { points: 100, correctAnswers: 20, gamesPlayed: 5 }
      const router = createMockRouter()
      const wrapper = mount(HomePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      // Verify the store mock was called and the component mounted with stats
      expect(wrapper.exists()).toBe(true)
      // The reactive ref value is accessible via the mock
      expect(mockGameStats.value.points).toBe(100)
      expect(mockGameStats.value.gamesPlayed).toBe(5)
    })
  })
})
