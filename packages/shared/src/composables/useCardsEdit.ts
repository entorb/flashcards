import { useQuasar } from 'quasar'
import { type ComputedRef, computed, nextTick, type Ref, ref } from 'vue'

import { TEXT_DE } from '../text-de'
import type { BaseCard } from '../types'
import { normalizeWhitespace } from '../utils/helper'

export interface PendingCardResult<TCard extends BaseCard> {
  card: TCard
  key: string
}

export interface CardsEditOptions<TCard extends BaseCard> {
  editingCards: Ref<TCard[]>
  createEmptyCard: () => TCard
  /** Field names of the blank row's inputs in DOM order (e.g. lwk: ['word'], voc: ['voc', 'de']). */
  fieldOrder: string[]
  /**
   * Normalize and validate the pending card. Returns:
   * - `{ card, key }` to commit (card already normalized; key is the duplicate-detection key)
   * - `{ error }` to reject with a warning notification
   * - `null` when the row is blank (no-op)
   */
  prepareCard: (pending: TCard) => PendingCardResult<TCard> | { error: string } | null
  /** Warning message shown when a committed card's key already exists. */
  duplicateMessage: (key: string) => string
  /** Unique key of a committed card for duplicate detection (e.g. lwk: word, voc: voc). */
  getKey: (card: TCard) => string
}

export interface CardsEditReturn<TCard extends BaseCard> {
  newCard: Ref<TCard>
  isBlankRow: (index: number) => boolean
  rows: ComputedRef<TCard[]>
  commitNewCard: (moveFocus?: boolean) => boolean
  onInputKeydown: (index: number, field: string, event: KeyboardEvent) => void
  onInputBlur: (index: number) => void
  removeCard: (index: number) => void
}

/**
 * Editing state for card lists with an always-present blank last row for adding cards.
 * Shared by the lwk and voc card edit pages.
 */
export function useCardsEdit<TCard extends BaseCard>(
  options: CardsEditOptions<TCard>
): CardsEditReturn<TCard> {
  const { editingCards, createEmptyCard, fieldOrder, prepareCard, duplicateMessage, getKey } =
    options
  const $q = useQuasar()

  const newCard = ref<TCard>(createEmptyCard()) as Ref<TCard>
  const isBlankRow = (index: number) => index === editingCards.value.length
  const rows = computed<TCard[]>(() => [...editingCards.value, newCard.value])

  function notifyError(message: string) {
    $q.notify({ type: 'warning', message })
  }

  function focusField(field: string, scroll = false) {
    void nextTick(() => {
      const items = document.querySelectorAll<HTMLElement>('[data-cy="card-edit-item"]')
      const lastItem = items[items.length - 1]
      if (!lastItem) return
      if (scroll) {
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      const inputs = lastItem.querySelectorAll<HTMLInputElement>('input')
      const target = inputs[fieldOrder.indexOf(field)]
      if (target) target.focus()
    })
  }

  function commitNewCard(moveFocus = true): boolean {
    const result = prepareCard(newCard.value)
    if (result === null) return true
    if ('error' in result) {
      notifyError(result.error)
      newCard.value = createEmptyCard()
      return false
    }
    const { card, key } = result
    if (editingCards.value.some(existing => normalizeWhitespace(getKey(existing)) === key)) {
      notifyError(duplicateMessage(key))
      newCard.value = createEmptyCard()
      return false
    }
    editingCards.value.push(card)
    newCard.value = createEmptyCard()
    if (moveFocus) {
      const firstField = fieldOrder[0]
      if (firstField !== undefined) focusField(firstField, true)
    }
    return true
  }

  function onInputKeydown(index: number, field: string, event: KeyboardEvent) {
    if (!isBlankRow(index)) return
    if (event.key !== 'Enter' && event.key !== 'Tab') return
    event.preventDefault()
    const nextField = fieldOrder[fieldOrder.indexOf(field) + 1]
    if (nextField === undefined) {
      commitNewCard()
    } else {
      focusField(nextField)
    }
  }

  function checkDuplicate(index: number) {
    const card = editingCards.value[index]
    // biome-ignore lint/complexity/useOptionalChain: optional chain prevents TS narrowing
    if (!(card && getKey(card).trim())) return
    const normalized = normalizeWhitespace(getKey(card))
    for (let i = 0; i < editingCards.value.length; i++) {
      if (i === index) continue
      const other = editingCards.value[i]
      if (!other) continue
      if (normalizeWhitespace(getKey(other)) === normalized) {
        notifyError(duplicateMessage(getKey(card).trim()))
        return
      }
    }
  }

  function onInputBlur(index: number) {
    if (!isBlankRow(index)) {
      checkDuplicate(index)
      return
    }
    // Commit when focus leaves the row; skip when it moved to another field of the same row
    if (fieldOrder.length > 1) {
      const items = document.querySelectorAll<HTMLElement>('[data-cy="card-edit-item"]')
      const lastItem = items[items.length - 1]
      if (lastItem?.contains(document.activeElement) ?? false) return
    }
    commitNewCard(false)
  }

  function removeCard(index: number) {
    if (editingCards.value.length <= 1) {
      $q.notify({ type: 'negative', message: TEXT_DE.shared.cardActions.lastCardError })
      return
    }
    editingCards.value.splice(index, 1)
  }

  return {
    newCard,
    isBlankRow,
    rows,
    commitNewCard,
    onInputKeydown,
    onInputBlur,
    removeCard
  }
}
