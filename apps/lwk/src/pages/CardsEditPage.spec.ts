import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
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
        { path: '/', name: '/HomePage', component: { template: '<div />' } },
        { path: '/cards', name: '/CardsManPage', component: { template: '<div />' } },
        { path: '/cards-edit', name: '/CardsEditPage', component: { template: '<div />' } }
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

    it('renders card edit items for each card plus the blank add row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('renders word input fields', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="word-input"]')).toHaveLength(3)
    })

    it('sorts cards alphabetically ignoring case on load', async () => {
      mockAllCards.value = [
        { word: 'Zebra', level: 1, time: 60 },
        { word: 'apfel', level: 1, time: 60 },
        { word: 'Apfel', level: 1, time: 60 },
        { word: 'Biene', level: 1, time: 60 }
      ]
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const words = wrapper
        .findAll('[data-cy="word-input"]')
        .slice(0, 4)
        .map(input => input.find('input').element.value)
      expect(words).toEqual(['apfel', 'Apfel', 'Biene', 'Zebra'])
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

    it('shows only the blank add row when no cards exist', async () => {
      mockAllCards.value = []
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(1)
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
      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
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

  // ─── Duplicate prevention ──────────────────────────────────────────────

  describe('duplicate prevention', () => {
    it('shows notification and does not save when duplicate words exist', async () => {
      mockAllCards.value = [
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'Jahr', level: 2, time: 30 }
      ]
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
      expect(mockImportCards).not.toHaveBeenCalled()
      expect(router.push).not.toHaveBeenCalled()
    })

    it('allows saving when all words are unique', async () => {
      mockAllCards.value = [
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'Haus', level: 2, time: 30 }
      ]
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledOnce()
      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
    })
  })

  // ─── Adding a new card via the blank last row ─────────────────────────────

  const getWordInput = (wrapper: ReturnType<typeof mount>, indexFromEnd: number) => {
    const inputs = wrapper.findAll('[data-cy="word-input"]')
    return inputs[inputs.length + indexFromEnd]
  }

  const getBlankWordInput = (wrapper: ReturnType<typeof mount>) => getWordInput(wrapper, -1)

  const typeInBlankRow = async (wrapper: ReturnType<typeof mount>, word: string) => {
    const input = getBlankWordInput(wrapper)
    if (!input) throw new Error('blank row input not found')
    await input.find('input').setValue(word)
    await wrapper.vm.$nextTick()
  }

  describe('adding a new card via the blank last row', () => {
    it('commits the word on Enter and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Neues Wort')
      await getBlankWordInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      const committed = getWordInput(wrapper, -2)
      expect(committed?.find('input').element.value).toBe('Neues Wort')
      const blank = getBlankWordInput(wrapper)
      expect(blank?.find('input').element.value).toBe('')
    })

    it('commits the word on Tab and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Tabwort')
      await getBlankWordInput(wrapper)?.trigger('keydown', { key: 'Tab' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      expect(getWordInput(wrapper, -2)?.find('input').element.value).toBe('Tabwort')
    })

    it('strips and collapses whitespace on commit', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, '  Mehr   Worte  ')
      await getBlankWordInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(getWordInput(wrapper, -2)?.find('input').element.value).toBe('Mehr Worte')
    })

    it('does not commit an empty word', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankWordInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('rejects a duplicate word with a warning and does not create a row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Jahr')
      await getBlankWordInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
      expect(getBlankWordInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('commits the word on blur and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Blurwort')
      await getBlankWordInput(wrapper)?.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      expect(getWordInput(wrapper, -2)?.find('input').element.value).toBe('Blurwort')
      expect(getBlankWordInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('does not commit an empty word on blur', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankWordInput(wrapper)?.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('does not commit from the word input of a committed row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const firstInput = wrapper.findAll('[data-cy="word-input"]')[0]
      await firstInput?.find('input').setValue('Geändert')
      await firstInput?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })
  })

  // ─── Commit on back ───────────────────────────────────────────────────────

  describe('commit on back', () => {
    it('commits a pending word when navigating back', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Unbestätigt')
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledOnce()
      const saved = mockImportCards.mock.calls[0] as unknown as [Card[]]
      expect(saved[0].map(c => c.word)).toContain('Unbestätigt')
      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
    })

    it('blocks navigation when the pending word is a duplicate', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Jahr')
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
      expect(mockImportCards).not.toHaveBeenCalled()
      expect(router.push).not.toHaveBeenCalled()
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

      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
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
