import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '../types'
import CardsManListOfCards from './CardsManListOfCards.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

const cards: BaseCard[] = [
  { level: 1, time: 60 },
  { level: 2, time: 30 },
  { level: 1, time: 45 }
]

const getLabel = (card: BaseCard) => `card-${card.level}-${card.time}`
const getKey = (card: BaseCard) => `${card.level}-${card.time}`

describe('CardsManListOfCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all cards when no level filter (selectedLevel=null)', () => {
    const wrapper = mount(CardsManListOfCards, {
      props: { allCards: cards, cardsToShow: cards, selectedLevel: null, getLabel, getKey },
      ...mountOptions
    })
    const text = wrapper.text()
    expect(text).toContain('card-1-60')
    expect(text).toContain('card-2-30')
    expect(text).toContain('card-1-45')
  })

  it('renders only filtered cards when level is selected', () => {
    const level1Cards = cards.filter(c => c.level === 1)
    const wrapper = mount(CardsManListOfCards, {
      props: { allCards: cards, cardsToShow: level1Cards, selectedLevel: 1, getLabel, getKey },
      ...mountOptions
    })
    const text = wrapper.text()
    expect(text).toContain('card-1-60')
    expect(text).toContain('card-1-45')
    expect(text).not.toContain('card-2-30')
  })

  it('uses getLabel prop for card display text', () => {
    const customGetLabel = (card: BaseCard) => `custom-${card.time}`
    const wrapper = mount(CardsManListOfCards, {
      props: {
        allCards: cards,
        cardsToShow: cards,
        selectedLevel: null,
        getLabel: customGetLabel,
        getKey
      },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('custom-60')
    expect(wrapper.text()).toContain('custom-30')
  })

  it('shows total count in header when selectedLevel is null', () => {
    const wrapper = mount(CardsManListOfCards, {
      props: { allCards: cards, cardsToShow: cards, selectedLevel: null, getLabel, getKey },
      ...mountOptions
    })
    expect(wrapper.text()).toContain(`(${cards.length})`)
  })

  it('shows filtered count and level in header when selectedLevel is set', () => {
    const level1Cards = cards.filter(c => c.level === 1)
    const wrapper = mount(CardsManListOfCards, {
      props: { allCards: cards, cardsToShow: level1Cards, selectedLevel: 1, getLabel, getKey },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain(`(${level1Cards.length})`)
  })
})
