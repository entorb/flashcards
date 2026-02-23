import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'

// Mock shared package
vi.mock('@flashcards/shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@flashcards/shared')>()
  return {
    ...actual,
    helperStatsDataWrite: vi.fn(async () => undefined)
  }
})

// Mock shared components
vi.mock('@flashcards/shared/components', () => ({
  AppFooter: { template: '<div data-cy="app-footer" />', props: ['basePath'] },
  HomePwaInstallInfo: { template: '<div data-cy="pwa-install-info" />' }
}))

// Mock useEtaStore
const mockStore = {
  startSession: vi.fn(),
  isSessionActive: { value: false },
  sessionData: { value: null },
  currentCompleted: { value: 0 },
  progressPercentage: { value: 0 }
}

vi.mock('@/composables/useEtaStore', () => ({
  useEtaStore: () => mockStore
}))

import ConfigView from './ConfigView.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: {
      ...quasarStubs,
      HourglassIcon: { template: '<div data-cy="hourglass-icon" />', props: ['progress'] }
    }
  }
}

describe('ConfigView', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('mounts without errors', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the total tasks input field', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="input-total-tasks"]').exists()).toBe(true)
  })

  it('renders the start button', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="btn-start"]').exists()).toBe(true)
  })

  it('renders the hourglass icon with progress=0', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="hourglass-icon"]').exists()).toBe(true)
  })

  it('renders the AppFooter component', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="app-footer"]').exists()).toBe(true)
  })

  it('renders the PWA install info component', async () => {
    const wrapper = mount(ConfigView, mountOptions)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-cy="pwa-install-info"]').exists()).toBe(true)
  })

  describe('handleStart', () => {
    it('does not call startSession when totalTasks is null', async () => {
      const wrapper = mount(ConfigView, mountOptions)
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-start"]').trigger('click')

      expect(mockStore.startSession).not.toHaveBeenCalled()
    })

    it('calls startSession with valid totalTasks', async () => {
      const wrapper = mount(ConfigView, mountOptions)
      await wrapper.vm.$nextTick()

      // Set totalTasks via the component's internal ref
      const vm = wrapper.vm as unknown as { totalTasks: number | null }
      vm.totalTasks = 10
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-start"]').trigger('click')

      expect(mockStore.startSession).toHaveBeenCalledWith(10)
    })

    it('does not call startSession when totalTasks is 0', async () => {
      const wrapper = mount(ConfigView, mountOptions)
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { totalTasks: number | null }
      vm.totalTasks = 0
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-start"]').trigger('click')

      expect(mockStore.startSession).not.toHaveBeenCalled()
    })

    it('does not call startSession when totalTasks is negative', async () => {
      const wrapper = mount(ConfigView, mountOptions)
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { totalTasks: number | null }
      vm.totalTasks = -5
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="btn-start"]').trigger('click')

      expect(mockStore.startSession).not.toHaveBeenCalled()
    })
  })
})
