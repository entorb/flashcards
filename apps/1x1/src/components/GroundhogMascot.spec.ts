import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GroundhogMascot from './GroundhogMascot.vue'

describe('GroundhogMascot', () => {
  it('mounts without errors', () => {
    const wrapper = mount(GroundhogMascot)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders an SVG element', () => {
    const wrapper = mount(GroundhogMascot)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies default size of 60', () => {
    const wrapper = mount(GroundhogMascot)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('60')
    expect(svg.attributes('height')).toBe('60')
  })

  it('applies custom size prop', () => {
    const wrapper = mount(GroundhogMascot, { props: { size: 120 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('120')
    expect(svg.attributes('height')).toBe('120')
  })

  it('renders teeth (neutral state) by default', () => {
    const wrapper = mount(GroundhogMascot)
    expect(wrapper.find('rect').exists()).toBe(true)
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,64"]').exists()).toBe(false)
  })

  it('renders smile when smile=true and grin=false', () => {
    const wrapper = mount(GroundhogMascot, { props: { smile: true } })
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(true)
    expect(wrapper.find('rect').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,64"]').exists()).toBe(false)
  })

  it('renders grin when grin=true', () => {
    const wrapper = mount(GroundhogMascot, { props: { grin: true } })
    expect(wrapper.find('path[d*="Q 50,64"]').exists()).toBe(true)
    expect(wrapper.find('rect').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(false)
  })

  it('grin takes priority over smile when both are true', () => {
    const wrapper = mount(GroundhogMascot, { props: { smile: true, grin: true } })
    expect(wrapper.find('path[d*="Q 50,64"]').exists()).toBe(true)
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(false)
    expect(wrapper.find('rect').exists()).toBe(false)
  })

  it('has accessible title element', () => {
    const wrapper = mount(GroundhogMascot)
    expect(wrapper.find('title').text()).toBe('Groundhog Yivit Mascot')
  })
})
