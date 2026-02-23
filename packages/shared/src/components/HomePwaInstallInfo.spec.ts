import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import HomePwaInstallInfo from './HomePwaInstallInfo.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

describe('HomePwaInstallInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders install card when not in standalone mode (default mock returns matches=false)', async () => {
    // setup.ts mocks matchMedia to return matches: false → not standalone → card shown
    const wrapper = mount(HomePwaInstallInfo, mountOptions)
    await wrapper.vm.$nextTick()
    // The q-card is rendered (stubbed as div) when isPwaInstalled=false
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.html()).not.toBe('')
  })

  it('does not render install card when in standalone mode', async () => {
    // Override matchMedia to return matches: true (standalone)
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
      matches: true,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as MediaQueryList)

    const wrapper = mount(HomePwaInstallInfo, mountOptions)
    await wrapper.vm.$nextTick()
    // v-if="!isPwaInstalled" → nothing rendered when standalone
    expect(wrapper.html()).toBe('<!--v-if-->')
  })
})
