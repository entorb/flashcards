import { ref } from 'vue'
import { describe, expect, it } from 'vitest'

import type { BaseCard } from '../types'
import { useCardFiltering } from './useCardFiltering'

function makeCards(levels: number[]): BaseCard[] {
  return levels.map(level => ({ level, time: 60 }))
}

describe('useCardFiltering', () => {
  describe('initial state', () => {
    it('selectedLevel starts as null', () => {
      const { selectedLevel } = useCardFiltering(() => makeCards([1, 2, 3]))
      expect(selectedLevel.value).toBeNull()
    })

    it('filteredCards is empty when selectedLevel is null', () => {
      const { filteredCards } = useCardFiltering(() => makeCards([1, 2, 3]))
      expect(filteredCards.value).toHaveLength(0)
    })
  })

  describe('handleLevelClick', () => {
    it('sets selectedLevel to the clicked level', () => {
      const { selectedLevel, handleLevelClick } = useCardFiltering(() => makeCards([1, 2, 3]))
      handleLevelClick(2)
      expect(selectedLevel.value).toBe(2)
    })

    it('filteredCards returns only cards matching the selected level', () => {
      const cards = makeCards([1, 2, 1, 2, 3])
      const { filteredCards, handleLevelClick } = useCardFiltering(() => cards)
      handleLevelClick(2)
      expect(filteredCards.value).toHaveLength(2)
      for (const card of filteredCards.value) {
        expect(card.level).toBe(2)
      }
    })

    it('toggles selectedLevel back to null when same level clicked again', () => {
      const { selectedLevel, handleLevelClick } = useCardFiltering(() => makeCards([1, 2, 3]))
      handleLevelClick(2)
      expect(selectedLevel.value).toBe(2)
      handleLevelClick(2)
      expect(selectedLevel.value).toBeNull()
    })

    it('filteredCards is empty after toggling level off', () => {
      const { filteredCards, handleLevelClick } = useCardFiltering(() => makeCards([1, 2, 3]))
      handleLevelClick(2)
      handleLevelClick(2)
      expect(filteredCards.value).toHaveLength(0)
    })

    it('switches to a different level without toggling off', () => {
      const { selectedLevel, handleLevelClick } = useCardFiltering(() => makeCards([1, 2, 3]))
      handleLevelClick(1)
      handleLevelClick(3)
      expect(selectedLevel.value).toBe(3)
    })
  })

  describe('reactivity', () => {
    it('filteredCards reacts to card list changes when source is reactive', () => {
      const cards = ref<BaseCard[]>([{ level: 1, time: 60 }])
      const { filteredCards, handleLevelClick } = useCardFiltering(() => cards.value)
      handleLevelClick(2)
      expect(filteredCards.value).toHaveLength(0)

      cards.value = [...cards.value, { level: 2, time: 60 }]
      expect(filteredCards.value).toHaveLength(1)
      expect(filteredCards.value[0]!.level).toBe(2)
    })

    it('filteredCards updates when reactive card list is replaced', () => {
      const cards = ref<BaseCard[]>([
        { level: 1, time: 60 },
        { level: 2, time: 60 }
      ])
      const { filteredCards, handleLevelClick } = useCardFiltering(() => cards.value)
      handleLevelClick(2)
      expect(filteredCards.value).toHaveLength(1)

      cards.value = [
        { level: 2, time: 60 },
        { level: 2, time: 60 }
      ]
      expect(filteredCards.value).toHaveLength(2)
    })
  })
})
