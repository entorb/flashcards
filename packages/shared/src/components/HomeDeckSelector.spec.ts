import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '../types'
import HomeDeckSelector from './HomeDeckSelector.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

interface TestDeck {
  name: string
  cards: BaseCard[]
}

const decks: TestDeck[] = [
  { name: 'Deck A', cards: [{ level: 1, time: 60 }] },
  { name: 'Deck B', cards: [{ level: 2, time: 30 }] }
]

describe('HomeDeckSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without errors', () => {
    const wrapper = mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck: vi.fn() },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('calls switchDeck with first deck when saved deck is missing', () => {
    const switchDeck = vi.fn()
    const loadSettings = vi.fn(() => ({ deck: 'NonExistent' }))
    mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck, loadSettings },
      ...mountOptions
    })
    // Falls back to first deck since 'NonExistent' is not in decks
    expect(switchDeck).toHaveBeenCalledWith('Deck A')
  })

  it('does not call switchDeck when saved deck exists', () => {
    const switchDeck = vi.fn()
    const loadSettings = vi.fn(() => ({ deck: 'Deck B' }))
    mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck, loadSettings },
      ...mountOptions
    })
    expect(switchDeck).not.toHaveBeenCalled()
  })

  it('calls switchDeck when deck selection changes', async () => {
    const switchDeck = vi.fn()
    const wrapper = mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck },
      ...mountOptions
    })
    switchDeck.mockClear()
    // Access internal handleDeckChange via vm internals
    const vm = wrapper.vm as unknown as { handleDeckChange: (name: string) => void }
    vm.handleDeckChange('Deck B')
    await wrapper.vm.$nextTick()
    expect(switchDeck).toHaveBeenCalledWith('Deck B')
  })

  it('updates settings via saveSettings when deck changes and settings exist', async () => {
    const switchDeck = vi.fn()
    const saveSettings = vi.fn()
    const loadSettings = vi.fn(() => ({ deck: 'Deck A', mode: 'copy' }))
    const wrapper = mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck, loadSettings, saveSettings },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { handleDeckChange: (name: string) => void }
    vm.handleDeckChange('Deck B')
    await wrapper.vm.$nextTick()
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ deck: 'Deck B' }))
  })

  it('does not call saveSettings when loadSettings returns null', async () => {
    const switchDeck = vi.fn()
    const saveSettings = vi.fn()
    const loadSettings = vi.fn(() => null)
    const wrapper = mount(HomeDeckSelector, {
      props: { getDecks: () => decks, switchDeck, loadSettings, saveSettings },
      ...mountOptions
    })
    const vm = wrapper.vm as unknown as { handleDeckChange: (name: string) => void }
    vm.handleDeckChange('Deck B')
    await wrapper.vm.$nextTick()
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('refresh method reloads decks and settings', async () => {
    const switchDeck = vi.fn()
    const getDecks = vi.fn(() => decks)
    const wrapper = mount(HomeDeckSelector, {
      props: { getDecks, switchDeck },
      ...mountOptions
    })
    getDecks.mockClear()
    const vm = wrapper.vm as unknown as { refresh: () => void }
    vm.refresh()
    await wrapper.vm.$nextTick()
    expect(getDecks).toHaveBeenCalled()
  })
})
