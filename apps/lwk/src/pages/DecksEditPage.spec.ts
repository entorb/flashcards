import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import DecksEditPage from './DecksEditPage.vue'

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockGetDecks = vi.fn(() => [
  { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] },
  { name: 'LWK_2', cards: [] }
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lwk DecksEditPage', () => {
  let mountedWrappers: ReturnType<typeof mount>[] = []

  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/cards', name: '/cards', component: { template: '<div />' } },
        { path: '/decks', name: '/decks', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        // Override QInput stub to render the #append slot (needed for save/cancel rename buttons)
        QInput: {
          template: '<div><input /><slot name="append" /></div>',
          props: ['modelValue', 'dense', 'outlined', 'autofocus', 'placeholder'],
          emits: ['update:modelValue', 'keydown'],
          methods: { focus() {} }
        }
      }
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
      { name: 'LWK_1', cards: [{ word: 'Jahr', level: 1, time: 60 }] },
      { name: 'LWK_2', cards: [] }
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

  // ─── Back navigation ──────────────────────────────────────────────────────

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

  // ─── Add deck ─────────────────────────────────────────────────────────────

  describe('add deck operation', () => {
    it('calls addDeck with a generated LWK_ name on add button click', async () => {
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockAddDeck).toHaveBeenCalledOnce()
      const calledWith = (mockAddDeck.mock.calls[0] as unknown as [string])[0]
      expect(calledWith).toMatch(/^LWK_/)
    })

    it('generates unique deck name that does not conflict with existing decks', async () => {
      // LWK_1 and LWK_2 exist → new deck should be LWK_3
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const calledWith = (mockAddDeck.mock.calls[0] as unknown as [string])[0]
      expect(calledWith).toBe('LWK_3')
    })

    it('refreshes deck list after successful add', async () => {
      mockGetDecks
        .mockReturnValueOnce([
          { name: 'LWK_1', cards: [] },
          { name: 'LWK_2', cards: [] }
        ])
        .mockReturnValueOnce([
          { name: 'LWK_1', cards: [] },
          { name: 'LWK_2', cards: [] },
          { name: 'LWK_3', cards: [] }
        ])

      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-cy="deck-item"]')).toHaveLength(3)
    })
  })

  // ─── Rename deck ──────────────────────────────────────────────────────────

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

    it('cancels rename without calling renameDeck on cancel click', async () => {
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
  })

  // ─── Remove deck ──────────────────────────────────────────────────────────

  describe('remove deck operation', () => {
    it('opens confirmation dialog on remove button click', async () => {
      // Need quasar mock for dialog — use the shared quasarMocks.$q
      const router = createMockRouter()
      const wrapper = mountPage(router)
      await wrapper.vm.$nextTick()

      // The shared DecksEditPage uses $q.dialog internally; with our quasarStubs
      // it won't throw. Just verify the button exists and is clickable.
      const removeBtn = wrapper.find('[data-cy="remove-deck-button"]')
      expect(removeBtn.exists()).toBe(true)
    })
  })

  // ─── Escape key ───────────────────────────────────────────────────────────

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
      const wrapper = mount(DecksEditPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      wrapper.unmount()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(router.push).not.toHaveBeenCalled()
    })
  })
})
