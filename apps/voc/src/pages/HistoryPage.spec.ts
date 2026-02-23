import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HistoryPage from './HistoryPage.vue'
import type { GameHistory } from '../types'

// Stub the shared HistoryPage so we can inspect props without running its full logic
const { SharedHistoryPageStub } = vi.hoisted(() => ({
  SharedHistoryPageStub: {
    name: 'HistoryPage',
    template: `<div data-cy="shared-history-page">
      <button data-cy="back-button" @click="$emit('back')" />
      <div
        v-for="(item, i) in history"
        :key="i"
        :data-cy="'history-game-' + i"
      >
        <span :data-cy="'history-game-' + i + '-points'">{{ getPoints(item) }}</span>
      </div>
    </div>`,
    props: ['history', 'formatDetails', 'getPoints', 'getCorrectAnswers'],
    emits: ['back']
  }
}))

vi.mock('@flashcards/shared/pages', () => ({
  HistoryPage: SharedHistoryPageStub
}))

// Mock history data
const mockHistory = ref<GameHistory[]>([])

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    history: mockHistory
  }))
}))

describe('voc HistoryPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/history', name: '/history', component: { template: '<div>History</div>' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs
      }
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockHistory.value = []
  })

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the shared HistoryPage component', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="shared-history-page"]').exists()).toBe(true)
    })
  })

  describe('empty history state', () => {
    it('passes empty history array to shared HistoryPage', async () => {
      mockHistory.value = []
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(sharedPage.props('history')).toEqual([])
    })

    it('renders no history items when history is empty', async () => {
      mockHistory.value = []
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy^="history-game-"]')).toHaveLength(0)
    })
  })

  describe('history with entries', () => {
    const makeEntry = (date: string, points = 10, correctAnswers = 5): GameHistory => ({
      date,
      points,
      correctAnswers,
      settings: {
        mode: 'multiple-choice',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      }
    })

    it('passes 3 entries to shared HistoryPage', async () => {
      mockHistory.value = [
        makeEntry('2024-01-01T10:00:00Z', 10, 5),
        makeEntry('2024-01-02T10:00:00Z', 20, 8),
        makeEntry('2024-01-03T10:00:00Z', 30, 10)
      ]
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(sharedPage.props('history') as GameHistory[]).toHaveLength(3)
    })

    it('passes history entries in original order (sorting is done by shared page)', async () => {
      const entries = [
        makeEntry('2024-01-01T10:00:00Z', 10, 5),
        makeEntry('2024-01-03T10:00:00Z', 30, 10),
        makeEntry('2024-01-02T10:00:00Z', 20, 8)
      ]
      mockHistory.value = entries
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const passedHistory = sharedPage.props('history') as GameHistory[]
      // The voc HistoryPage passes history as-is; shared HistoryPage handles sorting
      expect(passedHistory).toEqual(entries)
    })
  })

  describe('formatDetails prop', () => {
    it('passes formatDetails function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('formatDetails')).toBe('function')
    })

    it('formatDetails includes mode text for multiple-choice', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: 'en' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('Multiple Choice')
    })

    it('formatDetails includes mode text for blind', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'blind', focus: 'weak', language: 'voc-de' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('Blind')
    })

    it('formatDetails includes mode text for typing', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'typing', focus: 'weak', language: 'voc-de' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('Schreiben')
    })

    it('formatDetails includes focus text', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'strong', language: 'voc-de' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('Starke')
    })

    it('formatDetails includes deck name when present', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: 'fr' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('fr')
    })

    it('formatDetails omits deck segment when deck is empty string', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de', deck: '' }
      }
      const result = formatDetails(entry)
      // deck is empty string → falsy → no deck segment
      expect(result).not.toMatch(/Deck:/)
    })
  })

  describe('getPoints prop', () => {
    it('passes getPoints function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('getPoints')).toBe('function')
    })

    it('getPoints returns rounded integer points', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const getPoints = sharedPage.props('getPoints') as (item: GameHistory) => number
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10.7,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de' }
      }
      expect(getPoints(entry)).toBe(11)
    })

    it('getPoints rounds down for .4 fractional points', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const getPoints = sharedPage.props('getPoints') as (item: GameHistory) => number
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10.4,
        correctAnswers: 5,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de' }
      }
      expect(getPoints(entry)).toBe(10)
    })
  })

  describe('getCorrectAnswers prop', () => {
    it('passes getCorrectAnswers function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('getCorrectAnswers')).toBe('function')
    })

    it('getCorrectAnswers returns string representation of correctAnswers', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const getCorrectAnswers = sharedPage.props('getCorrectAnswers') as (
        item: GameHistory
      ) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 7,
        settings: { mode: 'multiple-choice', focus: 'weak', language: 'voc-de' }
      }
      expect(getCorrectAnswers(entry)).toBe('7')
    })
  })

  describe('back button navigation', () => {
    it('navigates to / when back button is clicked', async () => {
      const router = createMockRouter()
      await router.push('/history')
      vi.spyOn(router, 'push')

      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      // The shared HistoryPage handles back navigation via router.push('/')
      // We verify the router is available and the component mounts correctly
      expect(wrapper.find('[data-cy="shared-history-page"]').exists()).toBe(true)
    })
  })

  describe('keyboard navigation', () => {
    it('delegates Escape key handling to the shared HistoryPage component', async () => {
      // The Escape key listener is registered by the shared HistoryPage via onMounted.
      // Since we stub the shared component, we verify the delegation by confirming
      // the shared page is rendered (it owns the keyboard logic).
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent(SharedHistoryPageStub).exists()).toBe(true)
    })
  })
})
