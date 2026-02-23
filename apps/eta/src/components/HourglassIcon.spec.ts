import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HourglassIcon from './HourglassIcon.vue'

describe('HourglassIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without errors', () => {
    const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders an SVG element', () => {
    const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  describe('progress=0 (empty hourglass)', () => {
    it('top sand is at max (topSandHeight = 50)', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      const vm = wrapper.vm as unknown as { topSandHeight: number; bottomSandHeight: number }
      expect(vm.topSandHeight).toBe(50)
    })

    it('bottom sand is at 0', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      const vm = wrapper.vm as unknown as { bottomSandHeight: number }
      expect(vm.bottomSandHeight).toBe(0)
    })

    it('isComplete is false', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      const vm = wrapper.vm as unknown as { isComplete: boolean }
      expect(vm.isComplete).toBe(false)
    })

    it('isActive is false', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      const vm = wrapper.vm as unknown as { isActive: boolean }
      expect(vm.isActive).toBe(false)
    })

    it('stars are not visible', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      // Stars are inside a v-if="isComplete" group
      const texts = wrapper.findAll('text')
      // No star text elements should be rendered
      const starTexts = texts.filter(t => t.text().includes('✨') || t.text().includes('⭐'))
      expect(starTexts).toHaveLength(0)
    })
  })

  describe('progress=50 (half-way)', () => {
    it('top and bottom sand are equal', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 50 } })
      const vm = wrapper.vm as unknown as { topSandHeight: number; bottomSandHeight: number }
      expect(vm.topSandHeight).toBe(25)
      expect(vm.bottomSandHeight).toBe(25)
    })

    it('isActive is true', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 50 } })
      const vm = wrapper.vm as unknown as { isActive: boolean }
      expect(vm.isActive).toBe(true)
    })

    it('falling sand element is visible', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 50 } })
      // The falling sand rect has class "falling-sand"
      const fallingSand = wrapper.find('.falling-sand')
      expect(fallingSand.exists()).toBe(true)
    })

    it('isComplete is false', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 50 } })
      const vm = wrapper.vm as unknown as { isComplete: boolean }
      expect(vm.isComplete).toBe(false)
    })
  })

  describe('progress=100 (complete)', () => {
    it('isComplete is true', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 100 } })
      const vm = wrapper.vm as unknown as { isComplete: boolean }
      expect(vm.isComplete).toBe(true)
    })

    it('stars are visible', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 100 } })
      const texts = wrapper.findAll('text')
      const starTexts = texts.filter(t => t.text().includes('✨') || t.text().includes('⭐'))
      expect(starTexts.length).toBeGreaterThan(0)
    })

    it('isActive is false', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 100 } })
      const vm = wrapper.vm as unknown as { isActive: boolean }
      expect(vm.isActive).toBe(false)
    })

    it('top sand is 0', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 100 } })
      const vm = wrapper.vm as unknown as { topSandHeight: number }
      expect(vm.topSandHeight).toBe(0)
    })

    it('bottom sand is at max (50)', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 100 } })
      const vm = wrapper.vm as unknown as { bottomSandHeight: number }
      expect(vm.bottomSandHeight).toBe(50)
    })
  })

  describe('size prop', () => {
    it('defaults to size=120', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0 } })
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('120')
    })

    it('applies custom size to SVG width', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0, size: 80 } })
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('80')
    })

    it('applies size * 1.4 to SVG height', () => {
      const wrapper = mount(HourglassIcon, { props: { progress: 0, size: 100 } })
      const svg = wrapper.find('svg')
      expect(svg.attributes('height')).toBe('140')
    })
  })
})
