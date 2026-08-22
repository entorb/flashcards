import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HomeGameModeButtons from './HomeGameModeButtons.vue'

const stubs = {
  QBtn: {
    name: 'QBtn',
    template: '<button :disabled="disable" @click="$emit(\'click\')"><slot /></button>',
    props: ['color', 'size', 'icon', 'label', 'disable'],
    emits: ['click']
  },
  QTooltip: { template: '<div><slot /></div>' }
}

describe('HomeGameModeButtons', () => {
  it('emits endless-level1 start', async () => {
    const wrapper = mount(HomeGameModeButtons, {
      props: { cards: [{ level: 1, time: 10 }] },
      global: { stubs }
    })
    await wrapper.find('[data-cy="start-endless-level1"]').trigger('click')
    expect(wrapper.emitted('start')).toEqual([['endless-level1']])
  })

  it('emits 3-rounds and endless-level5 start', async () => {
    const wrapper = mount(HomeGameModeButtons, {
      props: { cards: [{ level: 2, time: 20 }] },
      global: { stubs }
    })
    await wrapper.find('[data-cy="start-three-rounds"]').trigger('click')
    await wrapper.find('[data-cy="start-endless-level5"]').trigger('click')
    expect(wrapper.emitted('start')).toEqual([['3-rounds'], ['endless-level5']])
  })

  it('disables buttons when no cards match the mode', () => {
    const wrapper = mount(HomeGameModeButtons, {
      props: { cards: [{ level: 3, time: 20 }] },
      global: { stubs }
    })
    expect(
      (wrapper.find('[data-cy="start-endless-level1"]').element as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (wrapper.find('[data-cy="start-three-rounds"]').element as HTMLButtonElement).disabled
    ).toBe(false)
    expect(
      (wrapper.find('[data-cy="start-endless-level5"]').element as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('disables all buttons for empty card list', () => {
    const wrapper = mount(HomeGameModeButtons, {
      props: { cards: [] },
      global: { stubs }
    })
    const buttons = [
      '[data-cy="start-endless-level1"]',
      '[data-cy="start-three-rounds"]',
      '[data-cy="start-endless-level5"]'
    ]
    for (const selector of buttons) {
      expect((wrapper.find(selector).element as HTMLButtonElement).disabled).toBe(true)
    }
  })
})
