import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import CardsEditPage from './CardsEditPage.vue'
import type { Card } from '../types'

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

    it('renders card edit items for each card', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(2)
    })

    it('renders voc-specific fields (voc and de inputs)', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="card-voc-0"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="card-de-0"]').exists()).toBe(true)
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
      expect(router.push).toHaveBeenCalledWith('/cards')
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

  describe('adding a new card', () => {
    it('appends an empty card when add button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const initialCount = wrapper.findAll('[data-cy="card-edit-item"]').length
      await wrapper.find('[data-cy="add-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(initialCount + 1)
    })

    it('new card has voc and de input fields', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const newIndex = 2 // 0 and 1 already exist
      expect(wrapper.find(`[data-cy="card-voc-${newIndex}"]`).exists()).toBe(true)
      expect(wrapper.find(`[data-cy="card-de-${newIndex}"]`).exists()).toBe(true)
    })
  })

  describe('deleting a card', () => {
    it('removes a card when delete button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      const initialCount = wrapper.findAll('[data-cy="card-edit-item"]').length
      await wrapper.find('[data-cy="delete-card-0"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(initialCount - 1)
    })

    it('removes the correct card by index', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="delete-card-0"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="card-edit-item"]')).toHaveLength(1)
      expect(wrapper.find('[data-cy="card-voc-0"]').exists()).toBe(true)
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

      expect(router.push).toHaveBeenCalledWith('/cards')
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

      expect(wrapper.find('[data-cy="card-voc-0"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="card-de-0"]').exists()).toBe(true)
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
