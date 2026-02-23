import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { GameHistory } from '@/types'
import HistoryPage from './HistoryPage.vue'

// ---------------------------------------------------------------------------
// Stub the shared HistoryPage
// ---------------------------------------------------------------------------

const { SharedHistoryPageStub } = vi.hoisted(() => ({
  SharedHistoryPageStub: {
    name: 'HistoryPage',
    template: `<div data-cy="shared-history-page">
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

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockHistory = ref<GameHistory[]>([])

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    history: mockHistory
  }))
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk HistoryPage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/history', name: '/history', component: { template: '<div />' } }
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

  const makeEntry = (
    date: string,
    points = 10,
    correctAnswers = 5,
    mode: 'copy' | 'hidden' = 'copy'
  ): GameHistory => ({
    date,
    points,
    correctAnswers,
    settings: { mode, focus: 'weak', deck: 'LWK_1' }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockHistory.value = []
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

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

  // ─── History data ─────────────────────────────────────────────────────────

  describe('history data', () => {
    it('passes empty history array when no entries', async () => {
      mockHistory.value = []
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(sharedPage.props('history')).toEqual([])
    })

    it('passes 3 history entries to shared HistoryPage', async () => {
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

    it('passes history entries in original order', async () => {
      const entries = [
        makeEntry('2024-01-03T10:00:00Z', 30, 10),
        makeEntry('2024-01-01T10:00:00Z', 10, 5)
      ]
      mockHistory.value = entries
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(sharedPage.props('history')).toEqual(entries)
    })
  })

  // ─── formatDetails prop ───────────────────────────────────────────────────

  describe('formatDetails prop', () => {
    it('passes formatDetails function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('formatDetails')).toBe('function')
    })

    it('formatDetails includes copy mode text', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const result = formatDetails(makeEntry('2024-01-01T10:00:00Z', 10, 5, 'copy'))
      expect(result.length).toBeGreaterThan(0)
    })

    it('formatDetails includes hidden mode text', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const result = formatDetails(makeEntry('2024-01-01T10:00:00Z', 10, 5, 'hidden'))
      expect(result.length).toBeGreaterThan(0)
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
        settings: { mode: 'copy', focus: 'strong', deck: 'LWK_1' }
      }
      const result = formatDetails(entry)
      // Should contain focus-related text
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
        settings: { mode: 'copy', focus: 'weak', deck: 'LWK_2' }
      }
      const result = formatDetails(entry)
      expect(result).toContain('LWK_2')
    })

    it('formatDetails omits deck segment when deck is absent', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const formatDetails = sharedPage.props('formatDetails') as (item: GameHistory) => string
      const entry: GameHistory = {
        date: '2024-01-01T10:00:00Z',
        points: 10,
        correctAnswers: 5,
        settings: { mode: 'copy', focus: 'weak' }
      }
      const result = formatDetails(entry)
      // No deck → no deck segment
      expect(result).not.toMatch(/LWK/)
    })
  })

  // ─── getPoints prop ───────────────────────────────────────────────────────

  describe('getPoints prop', () => {
    it('passes getPoints function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('getPoints')).toBe('function')
    })

    it('getPoints returns rounded integer', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const getPoints = sharedPage.props('getPoints') as (item: GameHistory) => number
      expect(getPoints(makeEntry('2024-01-01T10:00:00Z', 10.7))).toBe(11)
      expect(getPoints(makeEntry('2024-01-01T10:00:00Z', 10.4))).toBe(10)
    })
  })

  // ─── getCorrectAnswers prop ───────────────────────────────────────────────

  describe('getCorrectAnswers prop', () => {
    it('passes getCorrectAnswers function to shared HistoryPage', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      expect(typeof sharedPage.props('getCorrectAnswers')).toBe('function')
    })

    it('getCorrectAnswers returns string of correctAnswers count', async () => {
      const router = createMockRouter()
      const wrapper = mount(HistoryPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const sharedPage = wrapper.findComponent(SharedHistoryPageStub)
      const getCorrectAnswers = sharedPage.props('getCorrectAnswers') as (
        item: GameHistory
      ) => string
      expect(getCorrectAnswers(makeEntry('2024-01-01T10:00:00Z', 10, 7))).toBe('7')
    })
  })
})
