import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { ScoringRulesPage } from '@flashcards/shared/pages'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'

describe('ScoringRules Component', () => {
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
    },
    props: {
      appName: '1x1' as const
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(ScoringRulesPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-cy="info-page-title"]').exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(ScoringRulesPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })
})
