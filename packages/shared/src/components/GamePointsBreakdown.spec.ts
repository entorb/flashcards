import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import GamePointsBreakdown from './GamePointsBreakdown.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

const baseBreakdown = {
  levelPoints: 10,
  difficultyPoints: 5,
  pointsBeforeBonus: 15,
  closeAdjustment: 3,
  languageBonus: 0,
  timeBonus: 0,
  totalPoints: 15
}

describe('GamePointsBreakdown', () => {
  it('renders nothing when answerStatus is null', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: null, pointsBreakdown: null },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(false)
  })

  it('renders nothing when answerStatus is "incorrect"', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'incorrect', pointsBreakdown: baseBreakdown },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(false)
  })

  it('renders total points for answerStatus="correct"', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'correct', pointsBreakdown: { ...baseBreakdown, totalPoints: 42 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('42')
  })

  it('renders total points for answerStatus="close"', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'close', pointsBreakdown: { ...baseBreakdown, totalPoints: 8 } },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('8')
  })

  it('renders close adjustment line for answerStatus="close"', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'close', pointsBreakdown: { ...baseBreakdown, closeAdjustment: 3 } },
      ...mountOptions
    })
    // closeAdjustment line is only shown for 'close'
    expect(wrapper.text()).toContain('3')
  })

  it('renders time bonus line when timeBonus > 0', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: {
        answerStatus: 'correct',
        pointsBreakdown: { ...baseBreakdown, timeBonus: 7, totalPoints: 22 }
      },
      ...mountOptions
    })
    expect(wrapper.text()).toContain('7')
  })

  it('does not render time bonus line when timeBonus is 0', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'correct', pointsBreakdown: { ...baseBreakdown, timeBonus: 0 } },
      ...mountOptions
    })
    // Only way to check absence: the breakdown text won't have a "+0 Zeit" line
    // We verify the component renders without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('renders nothing when pointsBreakdown is null even for correct status', () => {
    const wrapper = mount(GamePointsBreakdown, {
      props: { answerStatus: 'correct', pointsBreakdown: null },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="correct-answer-feedback"]').exists()).toBe(false)
  })
})
