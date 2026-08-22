import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BaseCard } from '../types'
import { getTimeBucketIndex } from '../utils/helper'
import CardsTimeHistogram from './CardsTimeHistogram.vue'

const mountOptions = {
  global: {
    mocks: quasarMocks,
    provide: quasarProvide,
    stubs: quasarStubs
  }
}

function makeCards(times: number[]): BaseCard[] {
  return times.map(time => ({ level: 1, time }))
}

describe('CardsTimeHistogram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 5 time buckets', () => {
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards: [] },
      ...mountOptions
    })
    expect(wrapper.findAll('.time-badge')).toHaveLength(5)
  })

  it('shows correct card count per bucket, MAX_TIME sentinel in >=20s', () => {
    // <5s: 2, <10s: 1, <15s: 1, <20s: 2, >=20s: 3 (incl. two 60s sentinels)
    const cards = makeCards([1, 4.9, 5, 12, 15, 19.9, 20, 60, 60])
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards },
      ...mountOptions
    })
    const badges = wrapper.findAll('.time-badge')
    const counts = badges.map(badge => badge.find('.text-h5').text())
    expect(counts).toEqual(['2', '1', '1', '2', '3'])
  })

  it('shows bucket labels', () => {
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards: [] },
      ...mountOptions
    })
    const labels = wrapper.findAll('.time-badge .text-caption').map(label => label.text())
    expect(labels).toEqual(['<5s', '<10s', '<15s', '<20s', '≥20s'])
  })

  it('emits bucketClick with correct bucket when tile is clicked', async () => {
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards: [] },
      ...mountOptions
    })
    const badges = wrapper.findAll('.time-badge')
    const lastBadge = badges[4]
    if (!lastBadge) {
      throw new Error('Last badge not found')
    }
    await lastBadge.trigger('click')
    expect(wrapper.emitted('bucketClick')).toEqual([[4]])
  })

  it('selected bucket has primary border style', () => {
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards: [], selectedBucket: 1 },
      ...mountOptions
    })
    const selectedBadge = wrapper.findAll('.time-badge')[1]
    expect(selectedBadge?.attributes('style')).toContain('3px solid var(--q-primary)')
  })

  it('non-selected buckets have transparent border', () => {
    const wrapper = mount(CardsTimeHistogram, {
      props: { cards: [], selectedBucket: 1 },
      ...mountOptions
    })
    const firstBadge = wrapper.findAll('.time-badge')[0]
    expect(firstBadge?.attributes('style')).toContain('3px solid transparent')
  })
})

describe('getTimeBucketIndex', () => {
  it('maps times to exclusive buckets', () => {
    expect(getTimeBucketIndex(0.1)).toBe(0)
    expect(getTimeBucketIndex(4.9)).toBe(0)
    expect(getTimeBucketIndex(5)).toBe(1)
    expect(getTimeBucketIndex(9.9)).toBe(1)
    expect(getTimeBucketIndex(10)).toBe(2)
    expect(getTimeBucketIndex(14.9)).toBe(2)
    expect(getTimeBucketIndex(15)).toBe(3)
    expect(getTimeBucketIndex(19.9)).toBe(3)
    expect(getTimeBucketIndex(20)).toBe(4)
    expect(getTimeBucketIndex(60)).toBe(4)
  })
})
