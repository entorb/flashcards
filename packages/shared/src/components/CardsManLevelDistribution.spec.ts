import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { BaseCard } from '../types'
import CardsManLevelDistribution from './CardsManLevelDistribution.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

function makeCards(counts: Record<number, number>): BaseCard[] {
  const cards: BaseCard[] = []
  for (const [level, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      cards.push({ level: Number(level), time: 60 })
    }
  }
  return cards
}

describe('CardsManLevelDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 5 level badges', () => {
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards: [] },
      ...mountOptions
    })
    // Each level badge has class "level-badge"
    expect(wrapper.findAll('.level-badge')).toHaveLength(5)
  })

  it('shows correct card count per level', () => {
    const cards = makeCards({ 1: 3, 2: 1, 3: 2, 4: 0, 5: 4 })
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards },
      ...mountOptions
    })
    const badges = wrapper.findAll('.level-badge')
    expect(badges).toHaveLength(5)
    const badge0 = badges[0]
    const badge1 = badges[1]
    const badge2 = badges[2]
    const badge3 = badges[3]
    const badge4 = badges[4]
    if (!badge0 || !badge1 || !badge2 || !badge3 || !badge4) {
      throw new Error('Expected 5 level badges')
    }
    // Each badge contains the count in a text-h5 div
    expect(badge0.find('.text-h5').text()).toBe('3')
    expect(badge1.find('.text-h5').text()).toBe('1')
    expect(badge2.find('.text-h5').text()).toBe('2')
    expect(badge3.find('.text-h5').text()).toBe('0')
    expect(badge4.find('.text-h5').text()).toBe('4')
  })

  it('emits levelClick with correct level when badge is clicked', async () => {
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards: [] },
      ...mountOptions
    })
    const badges = wrapper.findAll('.level-badge')
    const levelThreeBadge = badges[2]
    expect(levelThreeBadge).toBeDefined()
    if (!levelThreeBadge) {
      throw new Error('Level 3 badge not found')
    }
    await levelThreeBadge.trigger('click') // level 3
    expect(wrapper.emitted('levelClick')).toEqual([[3]])
  })

  it('emits reset when reset button is clicked', async () => {
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards: [] },
      ...mountOptions
    })
    await wrapper.find('[data-cy="reset-levels-button"]').trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('selected badge has primary border style', () => {
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards: [], selectedLevel: 2 },
      ...mountOptions
    })
    const badges = wrapper.findAll('.level-badge')
    const selectedBadge = badges[1]
    expect(selectedBadge).toBeDefined()
    if (!selectedBadge) {
      throw new Error('Selected badge not found')
    }
    expect(selectedBadge.attributes('style')).toContain('3px solid var(--q-primary)')
  })

  it('non-selected badges have transparent border', () => {
    const wrapper = mount(CardsManLevelDistribution, {
      props: { cards: [], selectedLevel: 2 },
      ...mountOptions
    })
    const badges = wrapper.findAll('.level-badge')
    const firstBadge = badges[0]
    const thirdBadge = badges[2]
    expect(firstBadge).toBeDefined()
    expect(thirdBadge).toBeDefined()
    if (!firstBadge || !thirdBadge) {
      throw new Error('Expected non-selected badges to exist')
    }
    expect(firstBadge.attributes('style')).toContain('3px solid transparent')
    expect(thirdBadge.attributes('style')).toContain('3px solid transparent')
  })
})
