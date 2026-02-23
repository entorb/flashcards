import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import AppFooter from './AppFooter.vue'

const { mockHelperStatsDataRead } = vi.hoisted(() => ({
  mockHelperStatsDataRead: vi.fn()
}))

vi.mock('../utils/helper', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/helper')>()
  return {
    ...actual,
    helperStatsDataRead: mockHelperStatsDataRead
  }
})

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('AppFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with basePath prop without errors', async () => {
    mockHelperStatsDataRead.mockResolvedValue(0)
    const wrapper = mount(AppFooter, {
      props: { basePath: '/1x1/' },
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('stats div is hidden when helperStatsDataRead returns 0', async () => {
    mockHelperStatsDataRead.mockResolvedValue(0)
    const wrapper = mount(AppFooter, {
      props: { basePath: '/1x1/' },
      ...mountOptions
    })
    // wait for onMounted async to resolve
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Spiele gespielt')
  })

  it('stats div is visible when helperStatsDataRead returns 1000', async () => {
    mockHelperStatsDataRead.mockResolvedValue(1000)
    const wrapper = mount(AppFooter, {
      props: { basePath: '/1x1/' },
      ...mountOptions
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Spiele gespielt')
  })

  it('contact link href contains basePath', async () => {
    mockHelperStatsDataRead.mockResolvedValue(0)
    const wrapper = mount(AppFooter, {
      props: { basePath: '/voc/' },
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const links = wrapper.findAll('a')
    const contactLink = links.find(l => l.text() === 'by Torben')
    expect(contactLink?.attributes('href')).toContain('/voc/')
  })

  it('renders Home, Disclaimer and GitHub links', async () => {
    mockHelperStatsDataRead.mockResolvedValue(0)
    const wrapper = mount(AppFooter, {
      props: { basePath: '/1x1/' },
      ...mountOptions
    })
    await wrapper.vm.$nextTick()
    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toContain('https://entorb.net/flashcards/')
    expect(hrefs).toContain('https://entorb.net/impressum.php')
    expect(hrefs).toContain('https://github.com/entorb/flashcards')
  })
})
