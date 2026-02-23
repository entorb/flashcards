import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card } from '@/types'
import GamePage from './GamePage.vue'

// Hoisted mock functions (plain vi.fn, no refs here)
const mocks = vi.hoisted(() => ({
  handleAnswer: vi.fn(),
  nextCard: vi.fn(() => false),
  finishGame: vi.fn(),
  discardGame: vi.fn()
}))

// Reactive store state — must be real Vue refs so the component's watch() works
const storeState = {
  gameCards: ref<Card[]>([]),
  currentCardIndex: ref(0),
  points: ref(0),
  currentCard: ref<Card | null>(null),
  gameSettings: ref<{ select: number[]; focus: string } | null>(null),
  lastPointsBreakdown: ref(null)
}

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameCards: storeState.gameCards,
    currentCardIndex: storeState.currentCardIndex,
    points: storeState.points,
    currentCard: storeState.currentCard,
    gameSettings: storeState.gameSettings,
    handleAnswer: mocks.handleAnswer,
    nextCard: mocks.nextCard,
    finishGame: mocks.finishGame,
    discardGame: mocks.discardGame,
    lastPointsBreakdown: storeState.lastPointsBreakdown
  }))
}))

describe('GamePage', () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: '/', component: { template: '<div />' } },
        { path: '/game', name: '/game', component: { template: '<div />' } },
        { path: '/game-over', name: '/game-over', component: { template: '<div />' } }
      ]
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        GameHeader: {
          template: `<div>
            <span data-cy="card-counter">{{ currentIndex + 1 }} / {{ totalCards }}</span>
            <button data-cy="back-button" @click="$emit('back')">Back</button>
          </div>`,
          props: ['currentIndex', 'totalCards', 'points'],
          emits: ['back']
        },
        GameShowCardQuestion: {
          template: '<div data-cy="question-display">{{ displayQuestion }}</div>',
          props: ['currentCard', 'displayQuestion', 'showCorrectAnswer']
        },
        GameInputSubmit: {
          template: `<div>
            <input data-cy="answer-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
            <button data-cy="submit-answer-button" @click="onSubmit()">Submit</button>
          </div>`,
          props: ['modelValue', 'buttonDisabled', 'onSubmit', 'inputType'],
          emits: ['update:modelValue']
        },
        GameFeedbackNegative: {
          template: '<div data-cy="feedback-negative">{{ userAnswer }} / {{ correctAnswer }}</div>',
          props: ['status', 'userAnswer', 'correctAnswer']
        },
        GamePointsBreakdown: {
          template: '<div data-cy="points-breakdown" />',
          props: ['answerStatus', 'pointsBreakdown']
        },
        GameNextCardButton: {
          template: '<button data-cy="next-card-button" @click="$emit(\'click\')">Next</button>',
          props: ['answerStatus'],
          emits: ['click', 'disabledChange']
        }
      }
    }
  })

  const withCard = () => {
    const card: Card = { question: '3x3', answer: 9, level: 1, time: 60 }
    storeState.currentCard.value = card
    storeState.gameCards.value = [card]
    storeState.gameSettings.value = { select: [3], focus: 'weak' }
    storeState.currentCardIndex.value = 0
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Reset store state
    storeState.currentCard.value = null
    storeState.gameCards.value = []
    storeState.gameSettings.value = null
    storeState.currentCardIndex.value = 0
    storeState.points.value = 0
    storeState.lastPointsBreakdown.value = null
    mocks.nextCard.mockReturnValue(false)
  })

  describe('mounting', () => {
    it('mounts with valid game state and renders without errors', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('redirects to / when no game cards and no settings', async () => {
      // gameCards is empty and gameSettings is null → should redirect
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(GamePage, createMountOptions(router))
      await Promise.resolve()
      expect(router.push).toHaveBeenCalledWith('/')
    })

    it('does not redirect when game cards are present', async () => {
      withCard()
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(GamePage, createMountOptions(router))
      await Promise.resolve()
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('card counter', () => {
    it('renders card-counter with correct index', async () => {
      withCard()
      storeState.gameCards.value = [
        { question: '3x3', answer: 9, level: 1, time: 60 },
        { question: '4x4', answer: 16, level: 1, time: 60 }
      ]
      storeState.currentCardIndex.value = 0
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('1 / 2')
    })
  })

  describe('question display', () => {
    it('shows the multiplication question', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="question-display"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="question-display"]').text()).toContain('3')
    })

    it('renders answer input when no feedback shown', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="submit-answer-button"]').exists()).toBe(true)
    })
  })

  describe('submitAnswer', () => {
    it('shows feedback with correct status when answer is right', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
        showFeedback: boolean
        answerStatus: string | null
      }
      vm.userAnswer = 9 // correct answer for 3×3
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(vm.showFeedback).toBe(true)
      expect(vm.answerStatus).toBe('correct')
      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
    })

    it('shows feedback with incorrect status when answer is wrong', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
        showFeedback: boolean
        answerStatus: string | null
      }
      vm.userAnswer = 5 // wrong answer for 3×3
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(vm.showFeedback).toBe(true)
      expect(vm.answerStatus).toBe('incorrect')
      expect(mocks.handleAnswer).toHaveBeenCalledWith('incorrect', expect.any(Number))
    })

    it('does not submit when userAnswer is null', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
        showFeedback: boolean
      }
      vm.userAnswer = null
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(vm.showFeedback).toBe(false)
      expect(mocks.handleAnswer).not.toHaveBeenCalled()
    })
  })

  describe('back button', () => {
    it('calls handleGoHome (discardGame + navigate to /) when back button clicked', async () => {
      withCard()
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mocks.discardGame).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith({ name: '/' })
    })
  })

  describe('feedback section', () => {
    it('shows next card button after submitting an answer', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
      }
      vm.userAnswer = 9
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="next-card-button"]').exists()).toBe(true)
    })

    it('hides answer input after submitting', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
      }
      vm.userAnswer = 9
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(false)
    })

    it('shows negative feedback for incorrect answer', async () => {
      withCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: number | null
        submitAnswer: () => void
      }
      vm.userAnswer = 5
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="feedback-negative"]').exists()).toBe(true)
    })
  })
})
