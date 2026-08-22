import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

import type { BaseCard } from '../types'
import { getTimeBucketIndex } from '../utils/helper'

interface UseCardFilteringReturn<T extends BaseCard> {
  selectedLevel: Ref<number | null>
  selectedTimeBucket: Ref<number | null>
  handleLevelClick: (level: number) => void
  handleTimeBucketClick: (bucket: number) => void
  filteredCards: ComputedRef<T[]>
}

export function useCardFiltering<T extends BaseCard = BaseCard>(
  getCards: () => T[]
): UseCardFilteringReturn<T> {
  const selectedLevel = ref<number | null>(null)
  const selectedTimeBucket = ref<number | null>(null)

  // Level and time filters are mutually exclusive — only one card list is shown
  function handleLevelClick(level: number) {
    selectedTimeBucket.value = null
    if (selectedLevel.value === level) {
      selectedLevel.value = null
      return
    }
    selectedLevel.value = level
  }

  function handleTimeBucketClick(bucket: number) {
    selectedLevel.value = null
    if (selectedTimeBucket.value === bucket) {
      selectedTimeBucket.value = null
      return
    }
    selectedTimeBucket.value = bucket
  }

  const filteredCards = computed(() => {
    if (selectedLevel.value !== null) {
      return getCards().filter(card => card.level === selectedLevel.value)
    }
    if (selectedTimeBucket.value !== null) {
      const bucket = selectedTimeBucket.value
      return getCards().filter(card => getTimeBucketIndex(card.time) === bucket)
    }
    return []
  })

  return {
    selectedLevel,
    selectedTimeBucket,
    handleLevelClick,
    handleTimeBucketClick,
    filteredCards
  }
}
