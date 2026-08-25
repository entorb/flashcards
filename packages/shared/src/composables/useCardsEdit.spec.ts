import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { BaseCard } from '../types'
import { normalizeWhitespace } from '../utils/helper'
import type { CardsEditOptions, PendingCardResult } from './useCardsEdit'
import { useCardsEdit } from './useCardsEdit'

const mockNotify = vi.fn()

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify: mockNotify })
}))

interface TestCard extends BaseCard {
  word: string
}

interface TestCardTwoFields extends BaseCard {
  voc: string
  de: string
}

const singleFieldOptions = (cards: TestCard[]): CardsEditOptions<TestCard> => ({
  editingCards: ref(cards),
  createEmptyCard: () => ({ word: '', level: 1, time: 60 }),
  fieldOrder: ['word'],
  prepareCard: (pending: TestCard): PendingCardResult<TestCard> | null => {
    const word = normalizeWhitespace(pending.word)
    if (!word) return null
    return { card: { word, level: 1, time: 60 }, key: word }
  },
  duplicateMessage: (key: string) => `Duplicate: ${key}`,
  getKey: (card: TestCard) => card.word
})

const twoFieldOptions = (cards: TestCardTwoFields[]): CardsEditOptions<TestCardTwoFields> => ({
  editingCards: ref(cards),
  createEmptyCard: () => ({ voc: '', de: '', level: 1, time: 60 }),
  fieldOrder: ['voc', 'de'],
  prepareCard: (
    pending: TestCardTwoFields
  ): PendingCardResult<TestCardTwoFields> | { error: string } | null => {
    const voc = normalizeWhitespace(pending.voc)
    const de = normalizeWhitespace(pending.de)
    if (!(voc || de)) return null
    if (!voc) return { error: 'voc required' }
    if (!de) return { error: 'de required' }
    return { card: { voc, de, level: 1, time: 60 }, key: voc }
  },
  duplicateMessage: (key: string) => `Duplicate: ${key}`,
  getKey: (card: TestCardTwoFields) => card.voc
})

const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent

describe('useCardsEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rows / isBlankRow', () => {
    it('appends a blank row to the editing cards', () => {
      const options = singleFieldOptions([{ word: 'Jahr', level: 1, time: 60 }])
      const { rows, isBlankRow } = useCardsEdit(options)

      expect(rows.value).toHaveLength(2)
      expect(isBlankRow(0)).toBe(false)
      expect(isBlankRow(1)).toBe(true)
    })

    it('shows only the blank row when no cards exist', () => {
      const options = singleFieldOptions([])
      const { rows, isBlankRow } = useCardsEdit(options)

      expect(rows.value).toHaveLength(1)
      expect(isBlankRow(0)).toBe(true)
    })
  })

  describe('commitNewCard', () => {
    it('does nothing when the pending card is blank', () => {
      const options = singleFieldOptions([])
      const { commitNewCard } = useCardsEdit(options)

      expect(commitNewCard(false)).toBe(true)
      expect(options.editingCards.value).toHaveLength(0)
      expect(mockNotify).not.toHaveBeenCalled()
    })

    it('commits a valid card and resets the blank row', () => {
      const options = singleFieldOptions([])
      const { commitNewCard, newCard } = useCardsEdit(options)

      newCard.value = { word: '  Neues   Wort ', level: 1, time: 60 }
      expect(commitNewCard(false)).toBe(true)
      expect(options.editingCards.value).toEqual([{ word: 'Neues Wort', level: 1, time: 60 }])
      expect(newCard.value.word).toBe('')
    })

    it('rejects a duplicate key with a warning and resets the row', () => {
      const options = singleFieldOptions([{ word: 'Jahr', level: 1, time: 60 }])
      const { commitNewCard, newCard } = useCardsEdit(options)

      newCard.value = { word: '  Jahr ', level: 1, time: 60 }
      expect(commitNewCard(false)).toBe(false)
      expect(options.editingCards.value).toHaveLength(1)
      expect(newCard.value.word).toBe('')
      expect(mockNotify).toHaveBeenCalledWith({ type: 'warning', message: 'Duplicate: Jahr' })
    })

    it('rejects when prepareCard returns an error', () => {
      const options = twoFieldOptions([])
      const { commitNewCard, newCard } = useCardsEdit(options)

      newCard.value = { voc: 'Apfel', de: '', level: 1, time: 60 }
      expect(commitNewCard(false)).toBe(false)
      expect(options.editingCards.value).toHaveLength(0)
      expect(mockNotify).toHaveBeenCalledWith({ type: 'warning', message: 'de required' })
    })
  })

  describe('onInputKeydown', () => {
    it('commits on Enter in the last field of the blank row', () => {
      const options = singleFieldOptions([])
      const { onInputKeydown, newCard } = useCardsEdit(options)

      newCard.value = { word: 'Test', level: 1, time: 60 }
      onInputKeydown(0, 'word', keyEvent('Enter'))
      expect(options.editingCards.value).toHaveLength(1)
      expect(options.editingCards.value[0]).toEqual({ word: 'Test', level: 1, time: 60 })
    })

    it('does not commit on Enter in a non-last field of the blank row', () => {
      const options = twoFieldOptions([])
      const { onInputKeydown } = useCardsEdit(options)

      onInputKeydown(0, 'voc', keyEvent('Enter'))
      expect(options.editingCards.value).toHaveLength(0)
    })

    it('does nothing on a committed row', () => {
      const options = singleFieldOptions([{ word: 'Jahr', level: 1, time: 60 }])
      const { onInputKeydown } = useCardsEdit(options)

      onInputKeydown(0, 'word', keyEvent('Enter'))
      expect(options.editingCards.value).toHaveLength(1)
    })
  })

  describe('onInputBlur', () => {
    it('commits the blank row when focus leaves it', () => {
      const options = singleFieldOptions([])
      const { onInputBlur, newCard } = useCardsEdit(options)

      newCard.value = { word: 'Blurwort', level: 1, time: 60 }
      onInputBlur(0)
      expect(options.editingCards.value).toHaveLength(1)
      expect(options.editingCards.value[0]).toEqual({ word: 'Blurwort', level: 1, time: 60 })
    })

    it('does not commit an empty blank row on blur', () => {
      const options = singleFieldOptions([])
      const { onInputBlur } = useCardsEdit(options)

      onInputBlur(0)
      expect(options.editingCards.value).toHaveLength(0)
    })

    it('warns about a duplicate when blurring a committed row', () => {
      const options = singleFieldOptions([
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'Haus', level: 1, time: 60 }
      ])
      const { onInputBlur } = useCardsEdit(options)

      options.editingCards.value[1]!.word = 'Jahr'
      onInputBlur(1)
      expect(mockNotify).toHaveBeenCalledWith({ type: 'warning', message: 'Duplicate: Jahr' })
    })
  })

  describe('removeCard', () => {
    it('removes a card when more than one exists', () => {
      const options = singleFieldOptions([
        { word: 'Jahr', level: 1, time: 60 },
        { word: 'Haus', level: 1, time: 60 }
      ])
      const { removeCard } = useCardsEdit(options)

      removeCard(0)
      expect(options.editingCards.value).toEqual([{ word: 'Haus', level: 1, time: 60 }])
    })

    it('refuses to remove the last card', () => {
      const options = singleFieldOptions([{ word: 'Jahr', level: 1, time: 60 }])
      const { removeCard } = useCardsEdit(options)

      removeCard(0)
      expect(options.editingCards.value).toHaveLength(1)
      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'negative' }))
    })
  })
})
