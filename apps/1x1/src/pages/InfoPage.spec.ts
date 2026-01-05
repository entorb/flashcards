import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import InfoPage from './InfoPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'

describe('InfoPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: '/', component: { template: '<div>Home</div>' } }]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: quasarStubs
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-cy="info-page-title"]').exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })
})
