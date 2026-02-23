import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EisiMascot from './EisiMascot.vue'

describe('EisiMascot', () => {
  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts without errors', () => {
      const wrapper = mount(EisiMascot)
      expect(wrapper.exists()).toBe(true)
    })

    it('renders an SVG element', () => {
      const wrapper = mount(EisiMascot)
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  // ─── Default (neutral) state ──────────────────────────────────────────────

  describe('neutral state (smile=false, grin=false)', () => {
    it('renders neutral mouth line when neither smile nor grin', () => {
      const wrapper = mount(EisiMascot, { props: { smile: false, grin: false } })
      // Neutral mouth is a <line> element
      expect(wrapper.find('line').exists()).toBe(true)
    })

    it('does not render smile path when smile=false', () => {
      const wrapper = mount(EisiMascot, { props: { smile: false, grin: false } })
      // The smile path has stroke="#4FC3F7"
      const paths = wrapper.findAll('path')
      const smilePath = paths.find(p => p.attributes('stroke') === '#4FC3F7')
      expect(smilePath).toBeUndefined()
    })

    it('does not render grin path when grin=false', () => {
      const wrapper = mount(EisiMascot, { props: { smile: false, grin: false } })
      // The grin path has stroke="#00BCD4"
      const paths = wrapper.findAll('path')
      const grinPath = paths.find(p => p.attributes('stroke') === '#00BCD4')
      expect(grinPath).toBeUndefined()
    })
  })

  // ─── Smile state ──────────────────────────────────────────────────────────

  describe('smile state (smile=true, grin=false)', () => {
    it('renders smile path when smile=true', () => {
      const wrapper = mount(EisiMascot, { props: { smile: true, grin: false } })
      const paths = wrapper.findAll('path')
      const smilePath = paths.find(p => p.attributes('stroke') === '#4FC3F7')
      expect(smilePath).toBeDefined()
    })

    it('does not render neutral mouth line when smile=true', () => {
      const wrapper = mount(EisiMascot, { props: { smile: true, grin: false } })
      expect(wrapper.find('line').exists()).toBe(false)
    })

    it('does not render grin path when smile=true and grin=false', () => {
      const wrapper = mount(EisiMascot, { props: { smile: true, grin: false } })
      const paths = wrapper.findAll('path')
      const grinPath = paths.find(p => p.attributes('stroke') === '#00BCD4')
      expect(grinPath).toBeUndefined()
    })
  })

  // ─── Grin state ───────────────────────────────────────────────────────────

  describe('grin state (grin=true)', () => {
    it('renders grin path when grin=true', () => {
      const wrapper = mount(EisiMascot, { props: { smile: false, grin: true } })
      const paths = wrapper.findAll('path')
      const grinPath = paths.find(p => p.attributes('stroke') === '#00BCD4')
      expect(grinPath).toBeDefined()
    })

    it('does not render neutral mouth line when grin=true', () => {
      const wrapper = mount(EisiMascot, { props: { smile: false, grin: true } })
      expect(wrapper.find('line').exists()).toBe(false)
    })

    it('grin takes priority over smile (v-if/v-else-if order)', () => {
      const wrapper = mount(EisiMascot, { props: { smile: true, grin: true } })
      const paths = wrapper.findAll('path')
      const grinPath = paths.find(p => p.attributes('stroke') === '#00BCD4')
      expect(grinPath).toBeDefined()
    })
  })

  // ─── Size prop ────────────────────────────────────────────────────────────

  describe('size prop', () => {
    it('defaults to size=60', () => {
      const wrapper = mount(EisiMascot)
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('60')
      expect(svg.attributes('height')).toBe('60')
    })

    it('applies custom size to SVG width and height', () => {
      const wrapper = mount(EisiMascot, { props: { size: 150 } })
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('150')
      expect(svg.attributes('height')).toBe('150')
    })

    it('applies size=100 correctly', () => {
      const wrapper = mount(EisiMascot, { props: { size: 100 } })
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('100')
      expect(svg.attributes('height')).toBe('100')
    })
  })

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has aria-labelledby attribute on SVG', () => {
      const wrapper = mount(EisiMascot)
      expect(wrapper.find('svg').attributes('aria-labelledby')).toBe('eisi-title')
    })

    it('has a title element for screen readers', () => {
      const wrapper = mount(EisiMascot)
      expect(wrapper.find('title').exists()).toBe(true)
    })
  })
})
