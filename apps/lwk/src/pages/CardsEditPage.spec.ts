import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card } from '@/types'
import CardsEditPage from './CardsEditPage.vue'

// ---------------------------------------------------------------------------
// Quasar mock
// ---------------------------------------------------------------------------

const mockNotify = vi.fn()
const mockDialogOnOk = vi.fn()
const mockDialog = vi.fn(() => ({ onOk: mockDialogOnOk }))

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: mockNotify, dialog: mockDialog })
}))

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockAllCards = ref<Card[]>([
  { word: 'Jahr', level: 1, time: 60 },
  { word: 'bleiben', level: 2, time: 45 }
])
const mockImportCards = vi.fn()

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    allCards: mockAllCards,
    importCards: mockImportCards
  }))
}))

// ---------------------------------------------------------------------------
// Clipboard mock
// ---------------------------------------------------------------------------

const mockClipboardWriteText = vi.fn(async () => Promise.resolve())
const mockClipboardReadText = vi.fn(async () => Promise.resolve(''))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk CardsEditPage', () => {
  let mountedWrappers: ReturnType<typeof mount>[] = []

  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } },
        { path: '/cards-edit', name: '/cards-edit', component: { template: '<div />' } }
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

  const mountPage = (router: ReturnType<typeof createMockRouter>) => {
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    mountedWrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountedWrappers = []
    mockAllCards.value = [
      { word: 'Jahr', level: 1, time: 60 },
      { word: 'bleiben', level: 2, time: 45 }
    ]
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: mockClipboardWriteText, readText: mockClipboardReadText },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    for (const wrapper of mountedWrappers) {
      try {
        wrapper.unmount()
      } catch {
        /* already unmounted */
      }
    }
    mountedWrappers = []
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders card edit items for each card', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(2)
    })

    it('renders word input fields', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="word-input"]')).toHaveLength(2)
    })

    it('renders add card button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="add-card-button"]').exists()).toBe(true)
    })

    it('renders back button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
    })

    it('renders export button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="export-button"]').exists()).toBe(true)
    })

    it('renders import button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="import-button"]').exists()).toBe(true)
    })

    it('shows empty state when no cards', async () => {
      mockAllCards.value = []
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(0)
    })
  })

  // ─── Back button ──────────────────────────────────────────────────────────

  describe('back button navigation', () => {
    it('calls importCards and navigates to /cards on back click', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledOnce()
      expect(router.push).toHaveBeenCalledWith('/cards')
    })

    it('shows notification and does not navigate when a card has empty word', async () => {
      mockAllCards.value = [{ word: '', level: 1, time: 60 }]
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  // ─── Add card ─────────────────────────────────────────────────────────────

  describe('adding a new card', () => {
    it('appends an empty card when add button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const before = wrapper.findAll('[data-cy="card-edit-item"]').length
      await wrapper.find('[data-cy="add-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(before + 1)
    })
  })

  // ─── Delete card ──────────────────────────────────────────────────────────

  describe('deleting a card', () => {
    it('removes a card when delete button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const before = wrapper.findAll('[data-cy="card-edit-item"]').length
      await wrapper.find('[data-cy="delete-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(before - 1)
    })
  })

  // ─── Escape key ───────────────────────────────────────────────────────────

  describe('Escape key navigation', () => {
    it('calls importCards and navigates to /cards on Escape', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(router.push).toHaveBeenCalledWith('/cards')
    })

    it('removes keydown listener on unmount', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(CardsEditPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      wrapper.unmount()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(router.push).not.toHaveBeenCalled()
    })
  })

  // ─── Export ───────────────────────────────────────────────────────────────

  describe('export button', () => {
    it('calls clipboard.writeText with TSV content on export click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="export-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockClipboardWriteText).toHaveBeenCalledOnce()
      const written = (mockClipboardWriteText.mock.calls[0] as unknown as [string])[0]
      expect(written).toContain('Jahr')
      expect(written).toContain('bleiben')
    })
  })

  // ─── Export — clipboard failure ───────────────────────────────────────────

  describe('export — clipboard failure', () => {
    it('shows negative notification when clipboard.writeText fails', async () => {
      mockClipboardWriteText.mockRejectedValueOnce(new Error('denied'))
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="export-button"]').trigger('click')
      // Wait for the rejected promise
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })
  })

  // ─── Import — clipboard success ───────────────────────────────────────────

  describe('import — clipboard success', () => {
    it('imports cards from clipboard TSV text', async () => {
      mockClipboardReadText.mockResolvedValueOnce('word\tlevel\nJahr\t1\nbleiben\t2')
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }))
    })

    it('shows error notification when clipboard text is empty', async () => {
      mockClipboardReadText.mockResolvedValueOnce('')
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })

    it('shows positive notification when clipboard text has no delimiter (treated as word list)', async () => {
      mockClipboardReadText.mockResolvedValueOnce('no-delimiter-here')
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      // parseCardsFromText treats it as newline-only word list → succeeds
      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }))
    })

    it('shows error notification when clipboard text has delimiter but no valid cards', async () => {
      // Tab-delimited but only header row, no data rows
      mockClipboardReadText.mockResolvedValueOnce('word\tlevel')
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      // parseCardsFromText returns cards=[] → noCardsFoundError
      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })
  })

  // ─── Import — clipboard access denied (manual dialog) ────────────────────

  describe('import — clipboard access denied', () => {
    it('opens manual import dialog when clipboard.readText fails', async () => {
      mockClipboardReadText.mockRejectedValueOnce(new Error('denied'))
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockDialog).toHaveBeenCalled()
    })

    it('processes text from manual import dialog onOk callback', async () => {
      mockClipboardReadText.mockRejectedValueOnce(new Error('denied'))
      // Make dialog fire onOk with valid TSV text
      mockDialogOnOk.mockImplementationOnce((cb: (text: string) => void) => {
        cb('word\tlevel\nJahr\t1')
        return { onOk: vi.fn() }
      })
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="import-button"]').trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }))
    })
  })
})
