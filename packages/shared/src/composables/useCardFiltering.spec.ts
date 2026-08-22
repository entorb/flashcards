import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { BaseCard } from '../types'
import { useCardFiltering } from './useCardFiltering'

function makeCards(levels: number[]): BaseCard[] {
  return levels.map(level => ({ level, time: 60 }))
}

function makeCardsWithTimes(times: number[]): BaseCard[] {
  return times.map(time => ({ level: 3, time }))
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

  describe('handleTimeBucketClick', () => {
    it('selectedTimeBucket starts as null', () => {
      const { selectedTimeBucket } = useCardFiltering(() => makeCardsWithTimes([1, 60]))
      expect(selectedTimeBucket.value).toBeNull()
    })

    it('sets selectedTimeBucket to the clicked bucket', () => {
      const { selectedTimeBucket, handleTimeBucketClick } = useCardFiltering(() =>
        makeCardsWithTimes([1, 60])
      )
      handleTimeBucketClick(0)
      expect(selectedTimeBucket.value).toBe(0)
    })

    it('filteredCards returns only cards within the selected time range', () => {
      const times = [1, 4.9, 5, 12, 15, 19.9, 20, 60]
      const { filteredCards, handleTimeBucketClick } = useCardFiltering(() =>
        makeCardsWithTimes(times)
      )
      handleTimeBucketClick(1)
      expect(filteredCards.value.map(card => card.time)).toEqual([5])
    })

    it('includes MAX_TIME sentinel (never answered) in >=20s bucket', () => {
      const { filteredCards, handleTimeBucketClick } = useCardFiltering(() =>
        makeCardsWithTimes([2, 60, 60])
      )
      handleTimeBucketClick(4)
      expect(filteredCards.value).toHaveLength(2)
    })

    it('toggles selectedTimeBucket back to null when same bucket clicked again', () => {
      const { selectedTimeBucket, handleTimeBucketClick } = useCardFiltering(() =>
        makeCardsWithTimes([1, 60])
      )
      handleTimeBucketClick(3)
      expect(selectedTimeBucket.value).toBe(3)
      handleTimeBucketClick(3)
      expect(selectedTimeBucket.value).toBeNull()
    })

    it('switches to a different bucket without toggling off', () => {
      const { selectedTimeBucket, handleTimeBucketClick } = useCardFiltering(() =>
        makeCardsWithTimes([1, 60])
      )
      handleTimeBucketClick(0)
      handleTimeBucketClick(4)
      expect(selectedTimeBucket.value).toBe(4)
    })
  })

  describe('level and time filter are mutually exclusive', () => {
    it('clicking a time bucket clears the selected level', () => {
      const { selectedLevel, selectedTimeBucket, handleLevelClick, handleTimeBucketClick } =
        useCardFiltering(() => makeCards([1, 2]))
      handleLevelClick(2)
      handleTimeBucketClick(4)
      expect(selectedLevel.value).toBeNull()
      expect(selectedTimeBucket.value).toBe(4)
    })

    it('filteredCards respects the time filter after a level was active', () => {
      const cards: BaseCard[] = [
        { level: 2, time: 1 },
        { level: 3, time: 30 }
      ]
      const { filteredCards, handleLevelClick, handleTimeBucketClick } = useCardFiltering(
        () => cards
      )
      handleLevelClick(2)
      handleTimeBucketClick(4)
      expect(filteredCards.value.map(card => card.time)).toEqual([30])
    })

    it('clicking a level clears the selected time bucket', () => {
      const { selectedLevel, selectedTimeBucket, handleTimeBucketClick, handleLevelClick } =
        useCardFiltering(() => makeCards([1, 2]))
      handleTimeBucketClick(0)
      handleLevelClick(1)
      expect(selectedTimeBucket.value).toBeNull()
      expect(selectedLevel.value).toBe(1)
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
