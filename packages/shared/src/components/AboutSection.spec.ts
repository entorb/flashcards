import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEXT_DE } from '../text-de'
import AboutSection from './AboutSection.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('AboutSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without errors', () => {
    const wrapper = mount(AboutSection, {
      props: { contactOrigin: '1x1' },
      ...mountOptions
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders about title', () => {
    const wrapper = mount(AboutSection, {
      props: { contactOrigin: '1x1' },
      ...mountOptions
    })
    expect(wrapper.text()).toContain(TEXT_DE.shared.info.aboutTitle)
  })

  it('renders contact link with correct origin', () => {
    const wrapper = mount(AboutSection, {
      props: { contactOrigin: 'voc' },
      ...mountOptions
    })
    const link = wrapper.find('a[href*="contact.php"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toContain('origin=voc')
  })

  it('renders GitHub link', () => {
    const wrapper = mount(AboutSection, {
      props: { contactOrigin: '1x1' },
      ...mountOptions
    })
    const link = wrapper.find('a[href*="github.com"]')
    expect(link.exists()).toBe(true)
  })

  it('renders share button', () => {
    const wrapper = mount(AboutSection, {
      props: { contactOrigin: '1x1' },
      ...mountOptions
    })
    const button = wrapper.find('button.share-button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain(TEXT_DE.shared.info.aboutShare)
  })

  it('copies URL to clipboard on share click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const wrapper = mount(AboutSection, {
      props: { contactOrigin: '1x1' },
      ...mountOptions
    })
    await wrapper.find('button.share-button').trigger('click')
    expect(writeText).toHaveBeenCalledWith('https://entorb.net/flashcards/')
  })
})
