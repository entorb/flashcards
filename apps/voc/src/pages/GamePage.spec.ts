import { mount } from '@vue/test-utils'
import type { SessionMode } from '@flashcards/shared'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { quasarMocks, quasarProvide, quasarStubs } from '@flashcards/shared/test-utils'
import type { Card, GameSettings } from '@/types'
import GamePage from './GamePage.vue'

// Hoisted mock functions
const mocks = vi.hoisted(() => ({
  handleAnswer: vi.fn(),
  nextCard: vi.fn(() => false),
  finishGame: vi.fn(),
  discardGame: vi.fn()
}))

// Reactive store state — real Vue refs so component watch() works
const storeState = {
  allCards: ref<Card[]>([]),
  gameCards: ref<Card[]>([]),
  currentCardIndex: ref(0),
  points: ref(0),
  currentCard: ref<Card | null>(null),
  gameSettings: ref<GameSettings | null>(null),
  lastPointsBreakdown: ref(null),
  sessionMode: ref<SessionMode>('standard')
}

vi.mock('@/composables/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    allCards: storeState.allCards,
    gameCards: storeState.gameCards,
    currentCardIndex: storeState.currentCardIndex,
    points: storeState.points,
    currentCard: storeState.currentCard,
    gameSettings: storeState.gameSettings,
    handleAnswer: mocks.handleAnswer,
    nextCard: mocks.nextCard,
    finishGame: mocks.finishGame,
    discardGame: mocks.discardGame,
    lastPointsBreakdown: storeState.lastPointsBreakdown,
    sessionMode: storeState.sessionMode
  }))
}))

// Sample cards for tests
const SAMPLE_CARDS: Card[] = [
  { voc: 'Where', de: 'Wo', level: 1, time: 60 },
  { voc: 'Who', de: 'Wer', level: 1, time: 60 },
  { voc: 'What', de: 'Was', level: 2, time: 60 },
  { voc: 'Why', de: 'Warum', level: 2, time: 60 }
]

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

  /** Set up store state with a single card in typing mode (voc→de) */
  const withTypingCard = (overrides: Partial<GameSettings> = {}) => {
    const card = SAMPLE_CARDS[0]!
    storeState.currentCard.value = card
    storeState.gameCards.value = [card]
    storeState.allCards.value = [...SAMPLE_CARDS]
    storeState.currentCardIndex.value = 0
    storeState.gameSettings.value = {
      mode: 'typing',
      focus: 'weak',
      language: 'voc-de',
      deck: 'en',
      ...overrides
    }
  }

  /** Set up store state with multiple cards in multiple-choice mode */
  const withMultipleChoiceCards = () => {
    storeState.currentCard.value = SAMPLE_CARDS[0]!
    storeState.gameCards.value = [...SAMPLE_CARDS]
    storeState.allCards.value = [...SAMPLE_CARDS]
    storeState.currentCardIndex.value = 0
    storeState.gameSettings.value = {
      mode: 'multiple-choice',
      focus: 'weak',
      language: 'voc-de',
      deck: 'en'
    }
  }

  /** Set up store state in blind mode */
  const withBlindCard = () => {
    const card = SAMPLE_CARDS[0]!
    storeState.currentCard.value = card
    storeState.gameCards.value = [card]
    storeState.allCards.value = [...SAMPLE_CARDS]
    storeState.currentCardIndex.value = 0
    storeState.gameSettings.value = {
      mode: 'blind',
      focus: 'weak',
      language: 'voc-de',
      deck: 'en'
    }
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Reset store state
    storeState.currentCard.value = null
    storeState.gameCards.value = []
    storeState.allCards.value = []
    storeState.gameSettings.value = null
    storeState.currentCardIndex.value = 0
    storeState.points.value = 0
    storeState.lastPointsBreakdown.value = null
    storeState.sessionMode.value = 'standard'
    mocks.nextCard.mockReturnValue(false)
  })

  // ─── Mounting ────────────────────────────────────────────────────────────

  describe('mounting', () => {
    it('mounts with valid game state and renders without errors', async () => {
      withTypingCard()
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
      withTypingCard()
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
      storeState.allCards.value = [...SAMPLE_CARDS]
      storeState.currentCardIndex.value = 1
      storeState.gameSettings.value = {
        mode: 'typing',
        focus: 'weak',
        language: 'voc-de',
        deck: 'en'
      }
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="card-counter"]').text()).toContain('2 / 4')
    })
  })

  // ─── Question display ─────────────────────────────────────────────────────

  describe('question display', () => {
    it('shows voc as question in voc-de direction', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      // In voc-de mode, question is the voc field ("Where")
      expect(wrapper.find('[data-cy="question-display"]').text()).toContain('Where')
    })

    it('shows de as question in de-voc direction', async () => {
      withTypingCard({ language: 'de-voc' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      // In de-voc mode, question is the de field ("Wo")
      expect(wrapper.find('[data-cy="question-display"]').text()).toContain('Wo')
    })
  })

  // ─── Typing mode ──────────────────────────────────────────────────────────

  describe('typing mode', () => {
    it('renders answer input in typing mode', async () => {
      withTypingCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="submit-answer-button"]').exists()).toBe(true)
    })

    it('calls handleAnswer with correct when typing correct answer', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
        answerStatus: string | null
      }
      vm.userAnswer = 'Wo' // correct German for "Where"
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
      expect(vm.answerStatus).toBe('correct')
    })

    it('calls handleAnswer with incorrect when typing wrong answer', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
        answerStatus: string | null
      }
      vm.userAnswer = 'xyz'
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('incorrect', expect.any(Number))
      expect(vm.answerStatus).toBe('incorrect')
    })

    it('calls handleAnswer with close for near-correct answer', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
        answerStatus: string | null
      }
      vm.userAnswer = 'Woo' // 1 char off from "Wo" — within Levenshtein threshold
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('close', expect.any(Number))
      expect(vm.answerStatus).toBe('close')
    })

    it('hides answer input after submitting', async () => {
      withTypingCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
      }
      vm.userAnswer = 'Wo'
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(false)
    })

    it('shows next card button after submitting', async () => {
      withTypingCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
      }
      vm.userAnswer = 'Wo'
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-cy="next-card-button"]').exists()).toBe(true)
    })

    it('does not re-submit when answerStatus is already set', async () => {
      withTypingCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
        answerStatus: string | null
      }
      vm.userAnswer = 'Wo'
      vm.handleTypingSubmit()
      vm.handleTypingSubmit() // second call should be ignored
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Multiple-choice mode ─────────────────────────────────────────────────

  describe('multiple-choice mode', () => {
    it('renders multiple-choice option buttons', async () => {
      withMultipleChoiceCards()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const options = wrapper.findAll('[data-cy="multiple-choice-option"]')
      expect(options).toHaveLength(4)
    })

    it('does not render typing input in multiple-choice mode', async () => {
      withMultipleChoiceCards()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="answer-input"]').exists()).toBe(false)
    })

    it('calls handleAnswer with correct when correct option clicked', async () => {
      withMultipleChoiceCards()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        handleMultipleChoiceSubmit: (option: string) => void
        answerStatus: string | null
        correctAnswer: string
      }
      // Submit the correct answer directly
      vm.handleMultipleChoiceSubmit(vm.correctAnswer)
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
      expect(vm.answerStatus).toBe('correct')
    })

    it('calls handleAnswer with incorrect when wrong option clicked', async () => {
      withMultipleChoiceCards()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as unknown as {
        handleMultipleChoiceSubmit: (option: string) => void
        answerStatus: string | null
        correctAnswer: string
      }
      vm.handleMultipleChoiceSubmit('__wrong_answer__')
      await wrapper.vm.$nextTick()

      expect(mocks.handleAnswer).toHaveBeenCalledWith('incorrect', expect.any(Number))
      expect(vm.answerStatus).toBe('incorrect')
    })
  })

  // ─── Blind mode ───────────────────────────────────────────────────────────

  describe('blind mode', () => {
    it('renders reveal-answer button initially', async () => {
      withBlindCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="reveal-answer-button"]').exists()).toBe(true)
    })

    it('does not render yes/no buttons before revealing', async () => {
      withBlindCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="blind-yes-button"]').exists()).toBe(false)
      expect(wrapper.find('[data-cy="blind-no-button"]').exists()).toBe(false)
    })

    it('shows yes/no buttons after clicking reveal', async () => {
      withBlindCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="reveal-answer-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="blind-yes-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="blind-no-button"]').exists()).toBe(true)
    })

    it('calls handleAnswer with correct when yes button clicked', async () => {
      withBlindCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="reveal-answer-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="blind-yes-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(mocks.handleAnswer).toHaveBeenCalledWith('correct', expect.any(Number))
    })

    it('calls handleAnswer with incorrect when no button clicked', async () => {
      withBlindCard()
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="reveal-answer-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-cy="blind-no-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(mocks.handleAnswer).toHaveBeenCalledWith('incorrect', expect.any(Number))
    })
  })

  // ─── Navigation to game-over ──────────────────────────────────────────────

  describe('navigation to game-over', () => {
    it('navigates to /game-over when last card is answered', async () => {
      withTypingCard()
      mocks.nextCard.mockReturnValue(true) // signals game over
      const router = createMockRouter()
      vi.spyOn(router, 'push')
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()

      // Submit an answer to trigger nextCard
      const vm = wrapper.vm as unknown as {
        userAnswer: string
        handleTypingSubmit: () => void
      }
      vm.userAnswer = 'Wo'
      vm.handleTypingSubmit()
      await wrapper.vm.$nextTick()

      // Click next card button to trigger navigation
      await wrapper.find('[data-cy="next-card-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mocks.finishGame).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith({ name: '/game-over' })
    })
  })

  // ─── Back button ──────────────────────────────────────────────────────────

  describe('back button', () => {
    it('calls discardGame and navigates to / when back button clicked', async () => {
      withTypingCard()
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

  // ─── Language direction ───────────────────────────────────────────────────

  describe('language direction', () => {
    it('question computed returns voc field in voc-de mode', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { question: string }
      expect(vm.question).toBe('Where')
    })

    it('question computed returns de field in de-voc mode', async () => {
      withTypingCard({ language: 'de-voc' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { question: string }
      expect(vm.question).toBe('Wo')
    })

    it('correctAnswer computed returns de field in voc-de mode', async () => {
      withTypingCard({ language: 'voc-de' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { correctAnswer: string }
      expect(vm.correctAnswer).toBe('Wo')
    })

    it('correctAnswer computed returns voc field in de-voc mode', async () => {
      withTypingCard({ language: 'de-voc' })
      const router = createMockRouter()
      const wrapper = mount(GamePage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { correctAnswer: string }
      expect(vm.correctAnswer).toBe('Where')
    })
  })
})
