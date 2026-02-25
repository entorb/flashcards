import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HomePageLayout from './HomePageLayout.vue'

const { mockHelperStatsDataRead } = vi.hoisted(() => ({
  mockHelperStatsDataRead: vi.fn()
}))

vi.mock('../utils/helper', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/helper')>()
  return { ...actual, helperStatsDataRead: mockHelperStatsDataRead }
})

const defaultStats = { gamesPlayed: 5, points: 100, correctAnswers: 20 }

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: {
      ...quasarStubs,
      AppFooter: { template: '<div data-cy="app-footer" />' },
      HomePwaInstallInfo: { template: '<div />' },
      HomeStatisticsCard: { template: '<div data-cy="statistics-card" />', props: ['statistics'] }
    }
  }
}

describe('HomePageLayout', () => {
  beforeEach(() => {
    mockHelperStatsDataRead.mockResolvedValue(0)
    vi.clearAllMocks()
  })

  it('mounts without errors', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test App', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders app title', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Mein Spiel', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="app-title"]').text()).toBe('Mein Spiel')
  })

  it('renders mascot slot content', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      slots: {
        mascot: '<div data-cy="mascot-slot">Maskottchen</div>',
        config: '<div />'
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="mascot-slot"]').exists()).toBe(true)
  })

  it('renders config slot content', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      slots: {
        mascot: '<div />',
        config: '<div data-cy="config-slot">Konfiguration</div>'
      },
      ...mountOptions
    })
    expect(wrapper.find('[data-cy="config-slot"]').exists()).toBe(true)
  })

  it('emits startGame when start button is clicked', async () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })
    await wrapper.find('[data-cy="start-button"]').trigger('click')
    expect(wrapper.emitted('startGame')).toHaveLength(1)
  })

  it('emits goToCards when cards button is clicked', async () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })
    await wrapper.find('[data-cy="cards-button"]').trigger('click')
    expect(wrapper.emitted('goToCards')).toHaveLength(1)
  })

  it('emits goToHistory when history button is clicked', async () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })
    await wrapper.find('[data-cy="history-button"]').trigger('click')
    expect(wrapper.emitted('goToHistory')).toHaveLength(1)
  })
})

// Requirement 6.4: HomePageLayout extra-buttons slot
describe('HomePageLayout — extra-buttons slot', () => {
  it('renders extra-buttons slot content between start and nav buttons', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      slots: {
        mascot: '<div />',
        config: '<div />',
        'extra-buttons': '<button data-cy="extra-btn">Extra</button>'
      },
      ...mountOptions
    })

    const extraBtn = wrapper.find('[data-cy="extra-btn"]')
    expect(extraBtn.exists()).toBe(true)
    expect(extraBtn.text()).toBe('Extra')

    // Verify ordering: start button → extra-buttons → nav buttons
    const html = wrapper.html()
    const startIdx = html.indexOf('data-cy="start-button"')
    const extraIdx = html.indexOf('data-cy="extra-btn"')
    const cardsIdx = html.indexOf('data-cy="cards-button"')
    expect(startIdx).toBeLessThan(extraIdx)
    expect(extraIdx).toBeLessThan(cardsIdx)
  })

  it('renders nothing when extra-buttons slot is not provided', () => {
    const wrapper = mount(HomePageLayout, {
      props: { appTitle: 'Test', basePath: '/test/', statistics: defaultStats },
      ...mountOptions
    })

    // The slot area should not contain any extra content
    expect(wrapper.find('[data-cy="extra-btn"]').exists()).toBe(false)
  })
})
