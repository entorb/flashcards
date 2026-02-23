import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FIRST_GAME_BONUS, STREAK_GAME_BONUS, STREAK_GAME_INTERVAL } from '../constants'
import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import ScoringRulesPage from './ScoringRulesPage.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('ScoringRulesPage (shared)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with appName="1x1" without errors', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('mounts with appName="lwk" without errors', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: 'lwk' },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('mounts with appName="voc" without errors', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: 'voc' },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders 1x1-specific content when appName="1x1"', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    // 1x1 shows multiply difficulty text
    expect(wrapper.html()).toContain('4x8')
  })

  it('renders lwk mode descriptions when appName="lwk"', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: 'lwk', pointsModeHidden: 4 },
      ...mountOptions
    })
    // lwk shows copy and hidden mode text
    expect(wrapper.html()).toContain('Abschreiben')
    expect(wrapper.html()).toContain('Verdeckt')
  })

  it('renders voc mode descriptions when appName="voc"', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: 'voc', pointsModeBlind: 4, pointsModeTyping: 8 },
      ...mountOptions
    })
    // voc shows choice, blind, typing mode text
    expect(wrapper.html()).toContain('Multiple Choice')
    expect(wrapper.html()).toContain('Blind')
    expect(wrapper.html()).toContain('Schreiben')
  })

  it('back button emits back event', async () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    await wrapper.find('[data-cy="back-button"]').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('renders FIRST_GAME_BONUS constant in text', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    expect(wrapper.html()).toContain(FIRST_GAME_BONUS.toString())
  })

  it('renders STREAK_GAME_BONUS constant in text', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    expect(wrapper.html()).toContain(STREAK_GAME_BONUS.toString())
  })

  it('renders STREAK_GAME_INTERVAL constant in text', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    expect(wrapper.html()).toContain(STREAK_GAME_INTERVAL.toString())
  })

  it('does not render lwk-specific content when appName="1x1"', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    expect(wrapper.html()).not.toContain('Abschreiben')
    expect(wrapper.html()).not.toContain('Verdeckt')
  })

  it('does not render voc-specific content when appName="lwk"', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: 'lwk' },
      ...mountOptions
    })
    expect(wrapper.html()).not.toContain('Multiple Choice')
  })

  it('renders base level points section', () => {
    const wrapper = mount(ScoringRulesPage, {
      props: { appName: '1x1' },
      ...mountOptions
    })
    // Level points are always shown
    expect(wrapper.html()).toContain('Level 1')
    expect(wrapper.html()).toContain('Level 5')
  })
})
