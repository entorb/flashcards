import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HomeStatisticsCard from './HomeStatisticsCard.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('HomeStatisticsCard', () => {
  it('renders gamesPlayed in stats-games-played', () => {
    const wrapper = mount(HomeStatisticsCard, {
      props: { statistics: { gamesPlayed: 7, points: 150, correctAnswers: 42 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="stats-games-played"]').text()).toContain('7')
  })

  it('renders points in stats-total-points', () => {
    const wrapper = mount(HomeStatisticsCard, {
      props: { statistics: { gamesPlayed: 0, points: 999, correctAnswers: 0 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="stats-total-points"]').text()).toContain('999')
  })

  it('renders correctAnswers in stats-correct-answers', () => {
    const wrapper = mount(HomeStatisticsCard, {
      props: { statistics: { gamesPlayed: 0, points: 0, correctAnswers: 55 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="stats-correct-answers"]').text()).toContain('55')
  })

  it('handles zero values without errors', () => {
    const wrapper = mount(HomeStatisticsCard, {
      props: { statistics: { gamesPlayed: 0, points: 0, correctAnswers: 0 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="stats-games-played"]').text()).toContain('0')
    expect(wrapper.find('[data-cy="stats-total-points"]').text()).toContain('0')
    expect(wrapper.find('[data-cy="stats-correct-answers"]').text()).toContain('0')
  })
})
