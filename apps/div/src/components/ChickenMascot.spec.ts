import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChickenMascot from './ChickenMascot.vue'

describe('ChickenMascot', () => {
  it('mounts without errors', () => {
    const wrapper = mount(ChickenMascot)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders an SVG element', () => {
    const wrapper = mount(ChickenMascot)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies default size of 60', () => {
    const wrapper = mount(ChickenMascot)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('60')
    expect(svg.attributes('height')).toBe('60')
  })

  it('applies custom size prop', () => {
    const wrapper = mount(ChickenMascot, { props: { size: 120 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('120')
    expect(svg.attributes('height')).toBe('120')
  })

  it('renders neutral mouth (line element) by default', () => {
    const wrapper = mount(ChickenMascot)
    expect(wrapper.find('line').exists()).toBe(true)
    expect(wrapper.find('path[d*="Q 50,56"]').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(false)
  })

  it('renders smile when smile=true and grin=false', () => {
    const wrapper = mount(ChickenMascot, { props: { smile: true } })
    expect(wrapper.find('path[d*="Q 50,56"]').exists()).toBe(true)
    expect(wrapper.find('line').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(false)
  })

  it('renders grin when grin=true', () => {
    const wrapper = mount(ChickenMascot, { props: { grin: true } })
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(true)
    expect(wrapper.find('line').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 50,56"]').exists()).toBe(false)
  })

  it('grin takes priority over smile when both are true', () => {
    const wrapper = mount(ChickenMascot, { props: { smile: true, grin: true } })
    expect(wrapper.find('path[d*="Q 50,60"]').exists()).toBe(true)
    expect(wrapper.find('path[d*="Q 50,56"]').exists()).toBe(false)
    expect(wrapper.find('line').exists()).toBe(false)
  })

  it('has accessible title element', () => {
    const wrapper = mount(ChickenMascot)
    expect(wrapper.find('title').text()).toBe('Diva')
  })
})
