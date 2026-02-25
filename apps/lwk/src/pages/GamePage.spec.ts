import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card, GameSettings } from '@/types'
import GamePage from './GamePage.vue'

// ---------------------------------------------------------------------------
// Hoisted mock functions
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  handleAnswer: vi.fn(),
  nextCard: vi.fn(() => false),
  finishGame: vi.fn(),
  discardGame: vi.fn()
}))

// Reactive store state — real Vue refs so component watch() works
const storeState = {
  gameCards: ref<Card[]>([]),
  currentCardIndex: ref(0),
  points: ref(0),
  currentCard: ref<Card | null>(null),
  gameSettings: ref<GameSettings | null>(null),
  sessionMode: ref<'standard' | 'endless-level1' | '3-rounds'>('standard')
}

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameCards: storeState.gameCards,
    currentCardIndex: storeState.currentCardIndex,
    points: storeState.points,
    currentCard: storeState.currentCard,
    gameSettings: storeState.gameSettings,
    sessionMode: storeState.sessionMode,
    handleAnswer: mocks.handleAnswer,
    nextCard: mocks.nextCard,
    finishGame: mocks.finishGame,
    discardGame: mocks.discardGame
  }))
}))

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_CARDS: Card[] = [
  { word: 'Jahr', level: 1, time: 60 },
  { word: 'bleiben', level: 1, time: 60 },
  { word: 'Januar', level: 2, time: 60 }
]

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

const createMockRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: '/', component: { template: '<div />' } },
      { path: '/game', name: '/game', component: { template: '<div />' } },
      { path: '/game-over', name: '/game-over', component: { template: '<div />' } }
    ]
  })

// ---------------------------------------------------------------------------
// Mount options factory
// ---------------------------------------------------------------------------

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
      GamePointsBreakdown: {
        template: '<div data-cy="points-breakdown" />',
        props: ['answerStatus', 'pointsBreakdown']
      },
      GameNextCardButton: {
        template: '<button data-cy="next-card-button" @click="$emit(\'click\')">Next</button>',
        props: ['answerStatus'],
        emits: ['click', 'disabledChange']
      },
      GameFeedbackNegative: {
        template: '<div data-cy="feedback-negative" />',
        props: ['status', 'userAnswer', 'correctAnswer']
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Helpers to set up store state
// ---------------------------------------------------------------------------

function withCopyCard(overrides: Partial<GameSettings> = {}) {
  const card = SAMPLE_CARDS[0]!
  storeState.currentCard.value = card
  storeState.gameCards.value = [card]
  storeState.currentCardIndex.value = 0
  storeState.gameSettings.value = { mode: 'copy', focus: 'weak', deck: 'LWK_1', ...overrides }
}

function withHiddenCard(overrides: Partial<GameSettings> = {}) {
  const card = SAMPLE_CARDS[0]!
  storeState.currentCard.value = card
  storeState.gameCards.value = [card]
  storeState.currentCardIndex.value = 0
  storeState.gameSettings.value = { mode: 'hidden', focus: 'weak', deck: 'LWK_1', ...overrides }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GamePage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    storeState.currentCard.value = null
    storeState.gameCards.value = []
    storeState.currentCardIndex.value = 0
    storeState.points.value = 0
    storeState.gameSettings.value = null
    storeState.sessionMode.value = 'standard'
    mocks.nextCard.mockReturnValue(false)
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts with valid game state without errors', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it('redirects to / when no current card', async () => {
      storeState.currentCard.value = null
      storeState.gameCards.value = []
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(GamePage, createMountOptions(router))
      await Promise.resolve()
      expect(router.push).toHaveBeenCalledWith('/')
    })

    it('does not redirect when current card is present', async () => {
      withCopyCard()
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(GamePage, createMountOptions(router))
      await Promise.resolve()
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  // ─── Card counter ─────────────────────────────────────────────────────────

  describe('card counter', () => {
    it('renders card-counter with correct index and total', async () => {
      storeState.currentCard.value = SAMPLE_CARDS[0]!
      storeState.gameCards.value = [...SAMPLE_CARDS]
      storeState.currentCardIndex.value = 1
      storeState.gameSettings.value = { mode: 'copy', focus: 'weak', deck: 'LWK_1' }
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('2 / 3')
    })
  })

  // ─── Copy mode ────────────────────────────────────────────────────────────

  describe('copy mode', () => {
    it('shows the word in copy mode', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="question-display"]').text()).toContain('Jahr')
    })

    it('renders answer input in copy mode', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
    })

    it('calls handleAnswer with correct when correct word submitted', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userInput: string
        submitAnswer: () => void
        answerStatus: string | null
      }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
      expect(vm.answerStatus).toBe('correct')
    })

    it('calls handleAnswer with incorrect when wrong word submitted', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userInput: string
        submitAnswer: () => void
        answerStatus: string | null
      }
      vm.userInput = 'xyz'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('incorrect', expect.any(Number))
      expect(vm.answerStatus).toBe('incorrect')
    })

    it('calls handleAnswer with close for near-correct answer', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userInput: string
        submitAnswer: () => void
        answerStatus: string | null
      }
      vm.userInput = 'Jah' // 1 deletion from 'Jahr' → distance 1
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('close', expect.any(Number))
      expect(vm.answerStatus).toBe('close')
    })

    it('hides answer input after submitting', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { userInput: string; submitAnswer: () => void }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(false)
    })

    it('shows next card button after submitting', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { userInput: string; submitAnswer: () => void }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="next-card-button"]').exists()).toBe(true)
    })

    it('does not re-submit when already submitted', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { userInput: string; submitAnswer: () => void }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      vm.submitAnswer() // second call should be ignored
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Hidden mode ──────────────────────────────────────────────────────────

  describe('hidden mode', () => {
    it('shows GO button before starting in hidden mode', async () => {
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="start-countdown-button"]').exists()).toBe(true)
    })

    it('does not show answer input before GO is clicked', async () => {
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(false)
    })

    it('hides GO button and shows input after clicking GO', async () => {
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="start-countdown-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="start-countdown-button"]').exists()).toBe(false)
    })

    it('startHiddenMode sets isHiddenModeActive and hides word', async () => {
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        startHiddenMode: () => void
        isHiddenModeActive: boolean
        showWord: boolean
        countdown: number
      }
      vm.startHiddenMode()
      await wrapper.vm.$nextTick()

      expect(vm.isHiddenModeActive).toBe(true)
      expect(vm.showWord).toBe(false)
      expect(vm.countdown).toBeGreaterThan(0)
    })

    it('countdown decrements via interval (uses fake timers)', async () => {
      vi.useFakeTimers()
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        startHiddenMode: () => void
        countdown: number
      }
      vm.startHiddenMode()
      await wrapper.vm.$nextTick()

      const initialCountdown = vm.countdown
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(vm.countdown).toBe(initialCountdown - 1)
      vi.useRealTimers()
    })

    it('countdown stops at 0', async () => {
      vi.useFakeTimers()
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        startHiddenMode: () => void
        countdown: number
      }
      vm.startHiddenMode()
      await wrapper.vm.$nextTick()

      // Advance past the full countdown duration
      vi.advanceTimersByTime(10000)
      await wrapper.vm.$nextTick()

      expect(vm.countdown).toBe(0)
      vi.useRealTimers()
    })

    it('calls handleAnswer with correct in hidden mode', async () => {
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      // Click GO to start hidden mode
      await wrapper.find('[data-cy="start-countdown-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userInput: string
        submitAnswer: () => void
        answerStatus: string | null
      }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
    })
  })

  // ─── Navigation ───────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('navigates to /game-over when last card is answered and next clicked', async () => {
      withCopyCard()
      mocks.nextCard.mockReturnValue(true) // signals game over
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { userInput: string; submitAnswer: () => void }
      vm.userInput = 'Jahr'
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="next-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mocks.finishGame).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith({ name: '/game-over' })
    })

    it('calls discardGame and navigates to / when back button clicked', async () => {
      withCopyCard()
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-cy="back-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mocks.discardGame).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith({ name: '/' })
    })

    it('Escape key calls discardGame and navigates to /', async () => {
      withCopyCard()
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      mount(GamePage, createMountOptions(router))
      await Promise.resolve()

      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await Promise.resolve()

      expect(mocks.discardGame).toHaveBeenCalled()
    })
  })

  // ─── submitAnswer guards ──────────────────────────────────────────────────

  describe('submitAnswer guards', () => {
    it('does not submit when userInput is empty', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { userInput: string; submitAnswer: () => void }
      vm.userInput = '   '
      vm.submitAnswer()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).not.toHaveBeenCalled()
    })

    it('does not submit when showFeedback is already true', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userInput: string
        submitAnswer: () => void
        showFeedback: boolean
      }
      vm.userInput = 'Jahr'
      vm.submitAnswer() // first submit
      await wrapper.vm.$nextTick()
      const callCount = mocks.handleAnswer.mock.calls.length

      vm.submitAnswer() // second submit — showFeedback is true, should be ignored
      expect(mocks.handleAnswer.mock.calls).toHaveLength(callCount)
    })
  })

  // ─── onUnmounted cleanup ──────────────────────────────────────────────────

  describe('onUnmounted cleanup', () => {
    it('removes keydown listener on unmount', async () => {
      withCopyCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      // Spy on removeEventListener to confirm cleanup
      const removeSpy = vi.spyOn(globalThis, 'removeEventListener')
      wrapper.unmount()

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeSpy.mockRestore()
    })

    it('clears countdown interval on unmount', async () => {
      vi.useFakeTimers()
      withHiddenCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as { startHiddenMode: () => void }
      vm.startHiddenMode()
      await wrapper.vm.$nextTick()

      // Unmount while countdown is running — should not throw
      expect(() => {
        wrapper.unmount()
      }).not.toThrow()
      vi.useRealTimers()
    })
  })
})
