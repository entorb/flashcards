import { quasarMocks, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Card } from '../types'
import CardsEditPage from './CardsEditPage.vue'

// Mock useQuasar for notify/dialog
vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: mockNotify,
    dialog: vi.fn(() => ({ onOk: vi.fn() }))
  })
}))

const mockNotify = vi.fn()

// Mock store
const mockAllCards = ref<Card[]>([
  { voc: 'hello', de: 'hallo', level: 1, time: 60 },
  { voc: 'cat', de: 'Katze', level: 2, time: 45 }
])
const mockImportCards = vi.fn()

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    allCards: mockAllCards,
    importCards: mockImportCards
  }))
}))

// Mock clipboard
const mockClipboardWriteText = vi.fn(async () => Promise.resolve())
const mockClipboardReadText = vi.fn(async () => Promise.resolve(''))

describe('voc CardsEditPage', () => {
  // Track mounted wrappers to unmount after each test,
  // preventing keydown listener accumulation on globalThis.
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
      // The shared useCardsEdit composable reads $q via inject, so its notify must be mockNotify too
      provide: { _q_: { ...quasarMocks.$q, notify: mockNotify } },
      stubs: { ...quasarStubs }
    }
  })

  /** Mount and register for auto-cleanup in afterEach */
  const mountPage = (router: ReturnType<typeof createMockRouter>) => {
    const wrapper = mount(CardsEditPage, createMountOptions(router))
    mountedWrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountedWrappers = []
    mockAllCards.value = [
      { voc: 'hello', de: 'hallo', level: 1, time: 60 },
      { voc: 'cat', de: 'Katze', level: 2, time: 45 }
    ]
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText: mockClipboardWriteText,
        readText: mockClipboardReadText
      },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    // Unmount all wrappers to remove globalThis keydown listeners
    for (const wrapper of mountedWrappers) {
      try {
        wrapper.unmount()
      } catch {
        // already unmounted
      }
    }
    mountedWrappers = []
  })

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

    it('renders voc-specific fields (voc and de inputs)', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-voc-input"]')).toHaveLength(3)
      expect(wrapper.findAll('[data-cy="card-de-input"]')).toHaveLength(3)
    })

    it('shows only the blank add row when no cards exist', async () => {
      mockAllCards.value = []
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(1)
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
  })

  describe('back button navigation', () => {
    it('calls importCards and navigates to /cards on back button click', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledOnce()
      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
    })

    it('shows notification and does not navigate when a card has empty voc', async () => {
      mockAllCards.value = [{ voc: '', de: 'hallo', level: 1, time: 60 }]
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
      expect(router.push).not.toHaveBeenCalled()
    })

    it('shows notification and does not navigate when a card has empty de', async () => {
      mockAllCards.value = [{ voc: 'hello', de: '', level: 1, time: 60 }]
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
    it('shows notification and does not save when duplicate vocs exist', async () => {
      mockAllCards.value = [
        { voc: 'hello', de: 'hallo', level: 1, time: 60 },
        { voc: 'hello', de: 'hey', level: 2, time: 30 }
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

    it('allows saving when all vocs are unique', async () => {
      mockAllCards.value = [
        { voc: 'hello', de: 'hallo', level: 1, time: 60 },
        { voc: 'world', de: 'Welt', level: 2, time: 30 }
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

  // ─── Adding a new card via the blank last row ──────────────────────────

  const getRowInput = (wrapper: ReturnType<typeof mount>, field: string, indexFromEnd: number) => {
    const inputs = wrapper.findAll(`[data-cy="${field}"]`)
    return inputs[inputs.length + indexFromEnd]
  }

  const getBlankVocInput = (wrapper: ReturnType<typeof mount>) =>
    getRowInput(wrapper, 'card-voc-input', -1)

  const getBlankDeInput = (wrapper: ReturnType<typeof mount>) =>
    getRowInput(wrapper, 'card-de-input', -1)

  const typeInBlankRow = async (wrapper: ReturnType<typeof mount>, voc: string, de: string) => {
    const vocInput = getBlankVocInput(wrapper)
    if (!vocInput) throw new Error('blank row voc input not found')
    await vocInput.find('input').setValue(voc)
    const deInput = getBlankDeInput(wrapper)
    if (!deInput) throw new Error('blank row de input not found')
    await deInput.find('input').setValue(de)
    await wrapper.vm.$nextTick()
  }

  describe('adding a new card via the blank last row', () => {
    it('commits the card on Enter in the de field and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Neues Wort', 'Neues Deutsch')
      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      expect(getRowInput(wrapper, 'card-voc-input', -2)?.find('input').element.value).toBe(
        'Neues Wort'
      )
      expect(getRowInput(wrapper, 'card-de-input', -2)?.find('input').element.value).toBe(
        'Neues Deutsch'
      )
      expect(getBlankVocInput(wrapper)?.find('input').element.value).toBe('')
      expect(getBlankDeInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('commits the card on Tab in the de field and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Tabwort', 'TabwortDE')
      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Tab' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      expect(getRowInput(wrapper, 'card-voc-input', -2)?.find('input').element.value).toBe(
        'Tabwort'
      )
      expect(getRowInput(wrapper, 'card-de-input', -2)?.find('input').element.value).toBe(
        'TabwortDE'
      )
    })

    it('Enter in the blank row voc field does not commit but keeps the row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankVocInput(wrapper)?.find('input').setValue('Unfertig')
      await getBlankVocInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('strips and collapses whitespace on commit', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, '  Mehr   Worte  ', '  Viele   Worte  ')
      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(getRowInput(wrapper, 'card-voc-input', -2)?.find('input').element.value).toBe(
        'Mehr Worte'
      )
      expect(getRowInput(wrapper, 'card-de-input', -2)?.find('input').element.value).toBe(
        'Viele Worte'
      )
    })

    it('does not commit an empty card', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('shows a warning and does not create a row when only voc is filled', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankVocInput(wrapper)?.find('input').setValue('NurVoc')
      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
      expect(getBlankVocInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('rejects a duplicate voc with a warning and does not create a row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'hello', 'hallo2')
      await getBlankDeInput(wrapper)?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
      expect(getBlankVocInput(wrapper)?.find('input').element.value).toBe('')
      expect(getBlankDeInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('commits the card on blur and appends a new blank row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Blurwort', 'BlurwortDE')
      await getBlankDeInput(wrapper)?.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(4)
      expect(getRowInput(wrapper, 'card-voc-input', -2)?.find('input').element.value).toBe(
        'Blurwort'
      )
      expect(getRowInput(wrapper, 'card-de-input', -2)?.find('input').element.value).toBe(
        'BlurwortDE'
      )
      expect(getBlankVocInput(wrapper)?.find('input').element.value).toBe('')
      expect(getBlankDeInput(wrapper)?.find('input').element.value).toBe('')
    })

    it('does not commit an empty card on blur', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await getBlankDeInput(wrapper)?.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })

    it('does not commit from the voc input of a committed row', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const firstInput = wrapper.findAll('[data-cy="card-voc-input"]')[0]
      await firstInput?.find('input').setValue('Geändert')
      await firstInput?.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(3)
    })
  })

  // ─── Commit on back ───────────────────────────────────────────────────────

  describe('commit on back', () => {
    it('commits a pending card when navigating back', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'Unbestätigt', 'UnbestätigtDE')
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledOnce()
      const saved = mockImportCards.mock.calls[0] as unknown as [Card[]]
      expect(saved[0].map(c => c.voc)).toContain('Unbestätigt')
      expect(saved[0].map(c => c.de)).toContain('UnbestätigtDE')
      expect(router.push).toHaveBeenCalledWith({ name: '/CardsManPage' })
    })

    it('blocks navigation when the pending card is a duplicate', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await typeInBlankRow(wrapper, 'hello', 'hallo2')
      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
      expect(mockImportCards).not.toHaveBeenCalled()
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('deleting a card', () => {
    it('removes a card when delete button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const initialCount = wrapper.findAll('[data-cy="card-edit-item"]').length
      await wrapper.find('[data-cy="delete-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(initialCount - 1)
    })

    it('removes the correct card by index', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="delete-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Cards are sorted alphabetically, so the first row is 'cat'.
      // After deleting it only 'hello' (plus blank row) remains.
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(2)
      const remainingVoc = wrapper.find('[data-cy="card-voc-input"]').find('input').element.value
      expect(remainingVoc).toBe('hello')
    })
  })

  describe('Escape key navigation', () => {
    it('calls importCards and navigates to /cards on Escape key', async () => {
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
      // Mount and immediately unmount — do NOT register in mountedWrappers
      const wrapper = mount(CardsEditPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      wrapper.unmount()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('export button', () => {
    it('calls clipboard.writeText with TSV content on export click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="export-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockClipboardWriteText).toHaveBeenCalledOnce()
      const written = (mockClipboardWriteText.mock.calls[0] as unknown as [string])[0]
      expect(written).toContain('voc\tde\tlevel')
      expect(written).toContain('hello\thallo\t1')
      expect(written).toContain('cat\tKatze\t2')
    })
  })

  describe('voc-specific card format', () => {
    it('renders voc/de fields, not question/answer fields', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-voc-input"]')).toHaveLength(3)
      expect(wrapper.findAll('[data-cy="card-de-input"]')).toHaveLength(3)
      expect(wrapper.find('[data-cy="card-question-0"]').exists()).toBe(false)
      expect(wrapper.find('[data-cy="card-answer-0"]').exists()).toBe(false)
    })

    it('passes cards with voc/de fields to importCards on save', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockImportCards).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ voc: 'hello', de: 'hallo' }),
          expect.objectContaining({ voc: 'cat', de: 'Katze' })
        ])
      )
    })
  })
})
