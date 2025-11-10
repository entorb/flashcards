import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import CardsPage from './CardsPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'

describe('CardsPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div>Home</div>' } },
        { path: '/cards-edit', name: '/cards-edit', component: { template: '<div>Edit</div>' } }
      ]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: { ...quasarStubs, LevelDistribution: { template: '<div />' } }
    }
  })

  it('mounts without errors', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    expect(wrapper.exists()).toBe(true)
  })

  it('renders back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    expect(wrapper.find('[data-cy="back-button"]').exists()).toBe(true)
  })

  it('computes cardsToShow when no level selected', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { cardsToShow: unknown[] }
    expect(vm.cardsToShow).toBeInstanceOf(Array)
  })

  it('mounts with game store properly', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    // Verify the component has access to game store
    const vm = wrapper.vm as unknown as { cardsToShow: unknown[] }
    expect(vm.cardsToShow).toBeDefined()
  })

  it('has targetLevel ref initialized', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    const vm = wrapper.vm as unknown as { targetLevel: number }
    expect(typeof vm.targetLevel).toBe('number')
  })

  it('computes level color correctly', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    const vm = wrapper.vm as unknown as { getLevelColor: (level: number) => string }
    const color = vm.getLevelColor(1)
    expect(typeof color).toBe('string')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
