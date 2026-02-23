import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '../types'
import DecksEditPage from './DecksEditPage.vue'

// Capture the dialog mock so individual tests can control onOk behaviour
let dialogMock = vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }))
let notifyMock = vi.fn()

vi.mock('quasar', () => ({
  useQuasar: () => ({
    dialog: (...args: Parameters<typeof dialogMock>) => dialogMock(...args),
    notify: (...args: Parameters<typeof notifyMock>) => notifyMock(...args)
  })
}))

const mockCards: BaseCard[] = [
  { level: 1, time: 60 },
  { level: 2, time: 30 }
]

const mockDecks = [
  { name: 'LWK_1', cards: mockCards },
  { name: 'LWK_2', cards: [{ level: 1, time: 60 }] as BaseCard[] }
]

function makeProps(
  overrides: Partial<{
    getDecks: () => typeof mockDecks
    addDeck: (name: string) => boolean
    removeDeck: (name: string) => boolean
    renameDeck: (oldName: string, newName: string) => boolean
    getNamingPattern: () => { prefix: string; startIndex: number }
  }> = {}
) {
  return {
    appPrefix: 'lwk' as const,
    getDecks: vi.fn(() => mockDecks),
    addDeck: vi.fn(() => true),
    removeDeck: vi.fn(() => true),
    renameDeck: vi.fn(() => true),
    getNamingPattern: vi.fn(() => ({ prefix: 'LWK_', startIndex: 1 })),
    ...overrides
  }
}

// Override QInput stub to render its append slot so save/cancel buttons are accessible
const stubs = {
  ...quasarStubs,
  QInput: {
    template: '<div><slot name="append" /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs
  }
}

describe('DecksEditPage (shared)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    dialogMock = vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }))
    notifyMock = vi.fn()
  })

  it('mounts with mock deck management props', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders deck list on mount', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('[data-cy="deck-item"]')
    expect(items).toHaveLength(2)
  })

  it('renders deck names in the list', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).toContain('LWK_1')
    expect(text).toContain('LWK_2')
  })

  it('add deck button calls addDeck with generated name', async () => {
    const addDeck = vi.fn(() => true)
    const getDecks = vi.fn(() => mockDecks)
    const wrapper = mount(DecksEditPage, {
      props: makeProps({ addDeck, getDecks }),
      ...mountOptions
    })
    await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
    expect(addDeck).toHaveBeenCalledWith('LWK_3')
  })

  it('add deck refreshes deck list on success', async () => {
    const newDecks = [...mockDecks, { name: 'LWK_3', cards: [] as BaseCard[] }]
    const getDecks = vi.fn().mockReturnValueOnce(mockDecks).mockReturnValueOnce(newDecks)
    const addDeck = vi.fn(() => true)
    const wrapper = mount(DecksEditPage, {
      props: makeProps({ addDeck, getDecks }),
      ...mountOptions
    })
    await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(getDecks).toHaveBeenCalledTimes(2)
  })

  it('rename button enters edit mode for that deck', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
    const firstRenameButton = renameButtons[0]
    expect(firstRenameButton).toBeDefined()
    if (!firstRenameButton) {
      throw new Error('Rename button not found')
    }
    await firstRenameButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)
  })

  it('save rename calls renameDeck with old and new name', async () => {
    const renameDeck = vi.fn(() => true)
    const wrapper = mount(DecksEditPage, {
      props: makeProps({ renameDeck }),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
    const firstRenameButton = renameButtons[0]
    expect(firstRenameButton).toBeDefined()
    if (!firstRenameButton) {
      throw new Error('Rename button not found')
    }
    await firstRenameButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Set the new name directly on the component's reactive state
    const vm = wrapper.vm as unknown as { newDeckName: string }
    vm.newDeckName = 'LWK_Renamed'
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
    expect(renameDeck).toHaveBeenCalledWith('LWK_1', 'LWK_Renamed')
  })

  it('cancel rename hides the rename input', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
    const firstRenameButton = renameButtons[0]
    expect(firstRenameButton).toBeDefined()
    if (!firstRenameButton) {
      throw new Error('Rename button not found')
    }
    await firstRenameButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)

    await wrapper.find('[data-cy="cancel-rename-button"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(false)
  })

  it('remove deck button calls removeDeck after dialog confirmation', async () => {
    const removeDeck = vi.fn(() => true)
    // Make dialog fire onOk callback immediately
    dialogMock.mockImplementationOnce(
      () =>
        ({
          onOk: (cb: () => void) => {
            cb()
            return { onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }
          },
          onCancel: vi.fn(),
          onDismiss: vi.fn()
        }) as ReturnType<typeof dialogMock>
    )

    const wrapper = mount(DecksEditPage, {
      props: makeProps({ removeDeck }),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const removeButtons = wrapper.findAll('[data-cy="remove-deck-button"]')
    const firstRemoveButton = removeButtons[0]
    expect(firstRemoveButton).toBeDefined()
    if (!firstRemoveButton) {
      throw new Error('Remove button not found')
    }
    await firstRemoveButton.trigger('click')
    expect(removeDeck).toHaveBeenCalledWith('LWK_1')
  })

  it('remove deck shows error when only one deck remains', async () => {
    const singleDeck = [{ name: 'LWK_1', cards: mockCards }]
    const wrapper = mount(DecksEditPage, {
      props: makeProps({ getDecks: vi.fn(() => singleDeck) }),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const removeButtons = wrapper.findAll('[data-cy="remove-deck-button"]')
    const firstRemoveButton = removeButtons[0]
    expect(firstRemoveButton).toBeDefined()
    if (!firstRemoveButton) {
      throw new Error('Remove button not found')
    }
    await firstRemoveButton.trigger('click')
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    expect(dialogMock).not.toHaveBeenCalled()
  })

  it('emits back event when back button is clicked', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('Escape key emits back when not in rename mode', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('Escape key cancels rename when in rename mode', async () => {
    const wrapper = mount(DecksEditPage, {
      props: makeProps(),
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
    const firstRenameButton = renameButtons[0]
    expect(firstRenameButton).toBeDefined()
    if (!firstRenameButton) {
      throw new Error('Rename button not found')
    }
    await firstRenameButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(false)
    expect(wrapper.emitted('back')).toBeFalsy()
  })

  // ─── saveRename — empty name ──────────────────────────────────────────────

  describe('saveRename — edge cases', () => {
    it('shows error when saving rename with empty name', async () => {
      const wrapper = mount(DecksEditPage, {
        props: makeProps(),
        ...mountOptions
      })
      await wrapper.vm.$nextTick()
      // Enter rename mode
      const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
      const firstRenameButton = renameButtons[0]
      expect(firstRenameButton).toBeDefined()
      if (!firstRenameButton) {
        throw new Error('Rename button not found')
      }
      await firstRenameButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Set empty name
      const vm = wrapper.vm as unknown as { newDeckName: string }
      vm.newDeckName = '   '
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })

    it('shows error when renameDeck returns false (duplicate name)', async () => {
      const renameDeck = vi.fn(() => false)
      const wrapper = mount(DecksEditPage, {
        props: makeProps({ renameDeck }),
        ...mountOptions
      })
      await wrapper.vm.$nextTick()
      const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
      const firstRenameButton = renameButtons[0]
      expect(firstRenameButton).toBeDefined()
      if (!firstRenameButton) {
        throw new Error('Rename button not found')
      }
      await firstRenameButton.trigger('click')
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { newDeckName: string }
      vm.newDeckName = 'LWK_2' // different name → triggers renameDeck
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })

    it('saves rename without calling renameDeck when name is unchanged', async () => {
      const renameDeck = vi.fn(() => true)
      const wrapper = mount(DecksEditPage, {
        props: makeProps({ renameDeck }),
        ...mountOptions
      })
      await wrapper.vm.$nextTick()
      const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
      const firstRenameButton = renameButtons[0]
      expect(firstRenameButton).toBeDefined()
      if (!firstRenameButton) {
        throw new Error('Rename button not found')
      }
      await firstRenameButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Keep same name (LWK_1) — no rename needed
      await wrapper.find('[data-cy="save-rename-button"]').trigger('click')
      expect(renameDeck).not.toHaveBeenCalled()
    })
  })

  // ─── addDeck — failure path ───────────────────────────────────────────────

  describe('addDeck — failure', () => {
    it('shows error notification when addDeck returns false', async () => {
      const addDeck = vi.fn(() => false)
      const wrapper = mount(DecksEditPage, {
        props: makeProps({ addDeck }),
        ...mountOptions
      })
      await wrapper.find('[data-cy="add-deck-button"]').trigger('click')
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })
  })

  // ─── handleRenameKeydown ──────────────────────────────────────────────────

  describe('handleRenameKeydown', () => {
    it('Enter key in rename input triggers saveRename', async () => {
      const renameDeck = vi.fn(() => true)
      const wrapper = mount(DecksEditPage, {
        props: makeProps({ renameDeck }),
        ...mountOptions
      })
      await wrapper.vm.$nextTick()
      const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
      const firstRenameButton = renameButtons[0]
      expect(firstRenameButton).toBeDefined()
      if (!firstRenameButton) {
        throw new Error('Rename button not found')
      }
      await firstRenameButton.trigger('click')
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { newDeckName: string }
      vm.newDeckName = 'LWK_New'
      await wrapper.vm.$nextTick()

      const input = wrapper.find('[data-cy="rename-input"]')
      await input.trigger('keydown', { key: 'Enter' })
      expect(renameDeck).toHaveBeenCalledWith('LWK_1', 'LWK_New')
    })

    it('Escape key in rename input cancels rename', async () => {
      const wrapper = mount(DecksEditPage, {
        props: makeProps(),
        ...mountOptions
      })
      await wrapper.vm.$nextTick()
      const renameButtons = wrapper.findAll('[data-cy="rename-deck-button"]')
      const firstRenameButton = renameButtons[0]
      expect(firstRenameButton).toBeDefined()
      if (!firstRenameButton) {
        throw new Error('Rename button not found')
      }
      await firstRenameButton.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(true)

      const input = wrapper.find('[data-cy="rename-input"]')
      await input.trigger('keydown', { key: 'Escape' })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="rename-input"]').exists()).toBe(false)
    })
  })
})
