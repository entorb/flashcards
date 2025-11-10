import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import CardsPage from './CardsPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'
import { initializeCards } from '@/services/storage'

describe('CardsPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    initializeCards()
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

  it('computes yValues from range', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    const vm = wrapper.vm as unknown as { yValues: number[] }
    expect(vm.yValues).toBeInstanceOf(Array)
    expect(vm.yValues.length).toBeGreaterThan(0)
  })

  it('computes xValues from range', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    const vm = wrapper.vm as unknown as { xValues: number[] }
    expect(vm.xValues).toBeInstanceOf(Array)
    expect(vm.xValues.length).toBeGreaterThan(0)
  })

  it('computes cardsInRange correctly', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { cardsInRange: unknown[] }
    expect(vm.cardsInRange).toBeInstanceOf(Array)
    expect(vm.cardsInRange.length).toBeGreaterThan(0)
  })

  it('computes minTime correctly', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { minTime: number }
    expect(typeof vm.minTime).toBe('number')
    expect(vm.minTime).toBeGreaterThanOrEqual(0.1)
  })

  it('computes maxTime correctly', async () => {
    const router = createMockRouter()
    const wrapper = mount(CardsPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { maxTime: number }
    expect(typeof vm.maxTime).toBe('number')
    expect(vm.maxTime).toBeLessThanOrEqual(60)
  })
})
