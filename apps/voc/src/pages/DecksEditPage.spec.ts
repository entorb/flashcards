import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import DecksEditPage from './DecksEditPage.vue'

// Mock useQuasar for notify/dialog
const mockNotify = vi.fn()
const mockDialogOnOk = vi.fn()
const mockDialog = vi.fn(() => ({ onOk: mockDialogOnOk }))

vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: mockNotify,
    dialog: mockDialog
  })
}))

// Mock store deck operations
const mockGetDecks = vi.fn(() => [
  { name: 'deck_0', cards: [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }] },
  { name: 'deck_1', cards: [] }
])
const mockAddDeck = vi.fn(() => true)
const mockRemoveDeck = vi.fn(() => true)
const mockRenameDeck = vi.fn(() => true)

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    getDecks: mockGetDecks,
    addDeck: mockAddDeck,
    removeDeck: mockRemoveDeck,
    renameDeck: mockRenameDeck
  }))
}))

describe('voc DecksEditPage', () => {
  let mountedWrappers: ReturnType<typeof mount>[] = []

  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } },
        { path: '/decks-edit', name: '/decks-edit', component: { template: '<div />' } }
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
    const wrapper = mount(DecksEditPage, createMountOptions(router))
    mountedWrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountedWrappers = []
    mockGetDecks.mockReturnValue([
      { name: 'deck_0', cards: [{ voc: 'hello', de: 'hallo', level: 1, time: 60 }] },
      { name: 'deck_1', cards: [] }
    ])
    mockAddDeck.mockReturnValue(true)
    mockRemoveDeck.mockReturnValue(true)
    mockRenameDeck.mockReturnValue(true)
  })

  afterEach(() => {
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

    it('renders deck list on mount', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="deck-item"]')).toHaveLength(2)
    })

    it('renders add deck button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="add-deck-button"]').exists()).toBe(true)
    })

    it('renders back button', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
    })

    it('renders rename and remove buttons for each deck', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-cy="rename-deck-button"]')).toHaveLength(2)
      expect(wrapper.findAll('[data-cy="remove-deck-button"]')).toHaveLength(2)
    })
  })

  describe('back button navigation', () => {
    it('navigates to /cards on back button click', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(router.push).toHaveBeenCalledWith('/cards')
    })
  })

  describe('Escape key navigation', () => {
    it('navigates to /cards on Escape key when not renaming', async () => {
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
      const wrapper = mount(DecksEditPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      wrapper.unmount()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('add deck operation', () => {
    it('calls addDeck with generated name on add button click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockAddDeck).toHaveBeenCalledOnce()
      const calledWith = (mockAddDeck.mock.calls[0] as unknown as [string])[0]
      expect(calledWith).toMatch(/^deck_/)
    })

    it('refreshes deck list after successful add', async () => {
      mockGetDecks
        .mockReturnValueOnce([
          { name: 'deck_0', cards: [] },
          { name: 'deck_1', cards: [] }
        ])
        .mockReturnValueOnce([
          { name: 'deck_0', cards: [] },
          { name: 'deck_1', cards: [] },
          { name: 'deck_2', cards: [] }
        ])

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="deck-item"]')).toHaveLength(3)
    })

    it('shows error notification when addDeck returns false', async () => {
      mockAddDeck.mockReturnValue(false)
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })

    it('generates unique deck name that does not conflict with existing decks', async () => {
      // deck_0 and deck_1 already exist, so new deck should be deck_2
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const calledWith = (mockAddDeck.mock.calls[0] as unknown as [string])[0]
      expect(calledWith).toBe('deck_2')
    })
  })

  describe('rename deck operation', () => {
    it('shows rename input when rename button is clicked', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)
    })

    it('shows save and cancel buttons in rename mode', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="save-rename-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="cancel-rename-button"]').exists()).toBe(true)
    })

    it('calls renameDeck and refreshes list on save', async () => {
      mockGetDecks
        .mockReturnValueOnce([
          { name: 'deck_0', cards: [] },
          { name: 'deck_1', cards: [] }
        ])
        .mockReturnValueOnce([
          { name: 'renamed', cards: [] },
          { name: 'deck_1', cards: [] }
        ])

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      // Start rename for first deck
      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Set the new name directly on the shared DecksEditPage's vm
      const sharedVm = wrapper.findComponent({ name: 'DecksEditPage' }).vm as {
        newDeckName: string
      }
      sharedVm.newDeckName = 'renamed'
      await wrapper.vm.$nextTick()

      // Save rename
      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockRenameDeck).toHaveBeenCalledWith('deck_0', 'renamed')
    })

    it('cancels rename without calling renameDeck on cancel button click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="cancel-rename-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockRenameDeck).not.toHaveBeenCalled()
      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(false)
    })

    it('shows error notification when renameDeck returns false', async () => {
      mockRenameDeck.mockReturnValue(false)
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Set a different name so the rename is attempted
      const sharedVm = wrapper.findComponent({ name: 'DecksEditPage' }).vm as {
        newDeckName: string
      }
      sharedVm.newDeckName = 'deck_1' // duplicate name
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })

    it('cancels rename on Escape key when in rename mode', async () => {
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      // Enter rename mode
      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)

      // Escape should cancel rename, not navigate
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(false)
      expect(router.push).not.toHaveBeenCalled()
    })

    it('shows error notification when saving empty name', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="rename-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Clear the input to whitespace-only
      const sharedVm = wrapper.findComponent({ name: 'DecksEditPage' }).vm as {
        newDeckName: string
      }
      sharedVm.newDeckName = '   '
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
      expect(mockRenameDeck).not.toHaveBeenCalled()
    })
  })

  describe('remove deck operation', () => {
    it('opens confirmation dialog on remove button click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="remove-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockDialog).toHaveBeenCalledOnce()
    })

    it('calls removeDeck when dialog is confirmed', async () => {
      // Simulate onOk being called immediately
      mockDialogOnOk.mockImplementation((cb: () => void) => {
        cb()
        return { onOk: mockDialogOnOk }
      })

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="remove-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockRemoveDeck).toHaveBeenCalledOnce()
    })

    it('shows error notification when only one deck remains', async () => {
      mockGetDecks.mockReturnValue([{ name: 'deck_0', cards: [] }])

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="remove-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
      expect(mockDialog).not.toHaveBeenCalled()
    })

    it('refreshes deck list after successful remove', async () => {
      mockDialogOnOk.mockImplementation((cb: () => void) => {
        cb()
        return { onOk: mockDialogOnOk }
      })
      mockGetDecks
        .mockReturnValueOnce([
          { name: 'deck_0', cards: [] },
          { name: 'deck_1', cards: [] }
        ])
        .mockReturnValueOnce([{ name: 'deck_1', cards: [] }])

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="remove-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="deck-item"]')).toHaveLength(1)
    })
  })
})
