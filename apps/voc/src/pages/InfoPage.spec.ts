import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import InfoPage from './InfoPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { loadDecks } from '@/services/storage'

describe('InfoPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    loadDecks() // Initialize default decks
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/info', name: '/info', component: { template: '<div>Info</div>' } }
      ]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        AppFooter: { template: '<div />' }
      }
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(InfoPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })
})
