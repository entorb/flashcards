import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import type { BaseCard } from '../types'

interface UseCardFilteringReturn<T extends BaseCard> {
  selectedLevel: Ref<number | null>
  handleLevelClick: (level: number) => void
  filteredCards: ComputedRef<T[]>
}

export function useCardFiltering<T extends BaseCard = BaseCard>(
  cards: Ref<T[]>
): UseCardFilteringReturn<T> {
  const selectedLevel = ref<number | null>(null)

  function handleLevelClick(level: number) {
    if (selectedLevel.value === level) {
      selectedLevel.value = null
      return
    }
    selectedLevel.value = level
  }

  const filteredCards = computed(() => {
    if (selectedLevel.value === null) {
      return []
    }
    return cards.value.filter(card => card.level === selectedLevel.value)
  })

  return {
    selectedLevel,
    handleLevelClick,
    filteredCards
  }
}
