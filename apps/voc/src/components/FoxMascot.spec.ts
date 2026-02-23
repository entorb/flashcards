import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FoxMascot from './FoxMascot.vue'

describe('FoxMascot', () => {
  it('mounts without errors', () => {
    const wrapper = mount(FoxMascot)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders an SVG element', () => {
    const wrapper = mount(FoxMascot)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies default size of 60', () => {
    const wrapper = mount(FoxMascot)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('60')
    expect(svg.attributes('height')).toBe('60')
  })

  it('applies custom size prop', () => {
    const wrapper = mount(FoxMascot, { props: { size: 120 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('120')
    expect(svg.attributes('height')).toBe('120')
  })

  it('has accessible title element', () => {
    const wrapper = mount(FoxMascot)
    expect(wrapper.find('title').text()).toBe('Fox Rabat Mascot')
  })

  it('renders neutral eyes (filled circles) by default', () => {
    const wrapper = mount(FoxMascot)
    // Neutral state: filled circles for eyes, no arc paths
    const eyeCircles = wrapper.findAll('circle[cx="22"], circle[cx="38"]')
    expect(eyeCircles).toHaveLength(2)
  })

  it('renders neutral mouth (straight line) by default', () => {
    const wrapper = mount(FoxMascot)
    expect(wrapper.find('path[d="M28 40 L 32 40"]').exists()).toBe(true)
  })

  it('renders smile mouth when smile=true', () => {
    const wrapper = mount(FoxMascot, { props: { smile: true } })
    expect(wrapper.find('path[d*="Q 30 45"]').exists()).toBe(true)
  })

  it('renders grin mouth when grin=true', () => {
    const wrapper = mount(FoxMascot, { props: { grin: true } })
    expect(wrapper.find('path[d*="Q 30 48"]').exists()).toBe(true)
  })

  it('renders arc eyes when smile=true', () => {
    const wrapper = mount(FoxMascot, { props: { smile: true } })
    // smile/grin state: arc paths for eyes instead of filled circles
    expect(wrapper.find('path[d*="A 4 4"]').exists()).toBe(true)
  })

  it('renders arc eyes when grin=true', () => {
    const wrapper = mount(FoxMascot, { props: { grin: true } })
    expect(wrapper.find('path[d*="A 4 4"]').exists()).toBe(true)
  })

  it('grin mouth takes priority over smile when both are true', () => {
    const wrapper = mount(FoxMascot, { props: { smile: true, grin: true } })
    expect(wrapper.find('path[d*="Q 30 48"]').exists()).toBe(true)
    expect(wrapper.find('path[d*="Q 30 45"]').exists()).toBe(false)
  })

  it('does not render smile mouth in neutral state', () => {
    const wrapper = mount(FoxMascot)
    expect(wrapper.find('path[d*="Q 30 45"]').exists()).toBe(false)
    expect(wrapper.find('path[d*="Q 30 48"]').exists()).toBe(false)
  })
})
