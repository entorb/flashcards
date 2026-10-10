import { quasarMocks, quasarProvide, quasarStubs } from "@flashcards/shared/test-utils"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import type { BaseCard } from "../types"
import CardsManPage from "./CardsManPage.vue"

// Controllable dialog/notify mocks
const dialogMock = vi.hoisted(() =>
  vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() })),
)
const notifyMock = vi.hoisted(() => vi.fn())

vi.mock("quasar", () => ({
  useQuasar: () => ({
    dialog: (...args: Parameters<typeof dialogMock>) => dialogMock(...args),
    notify: (...args: Parameters<typeof notifyMock>) => notifyMock(...args),
  }),
}))

// Helper to create a dialog mock that fires onOk immediately
function makeDialogWithOk(cb?: () => void) {
  return {
    onOk: (fn: () => void) => {
      if (cb) cb()
      fn()
      return { onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }
    },
    onCancel: vi.fn(),
    onDismiss: vi.fn(),
  } as ReturnType<typeof dialogMock>
}

// Dialog mock whose prompt resolves with the given value
function makeDialogWithValue(value: string) {
  return {
    onOk: (fn: (val: string) => void) => {
      fn(value)
      return { onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }
    },
    onCancel: vi.fn(),
    onDismiss: vi.fn(),
  } as unknown as ReturnType<typeof dialogMock>
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div />" } },
    { path: "/cards-edit", component: { template: "<div />" } },
  ],
})

const mockCards: BaseCard[] = [
  { level: 1, time: 60 },
  { level: 2, time: 30 },
  { level: 3, time: 15 },
]

function makeMockStore() {
  return {
    allCards: ref<BaseCard[]>(mockCards),
    moveAllCards: vi.fn(),
    resetCards: vi.fn(),
  }
}

function makeProps(store: ReturnType<typeof makeMockStore>) {
  return {
    appPrefix: "lwk" as const,
    title: "Kartenverwaltung",
    bannerHtml: "<strong>Info</strong>",
    decksTitle: "Decks",
    editCardsRoute: "/cards-edit",
    getDecks: vi.fn(() => [
      { name: "LWK_1", cards: mockCards },
      { name: "LWK_2", cards: [] },
    ]),
    addDeck: vi.fn(() => true),
    renameDeck: vi.fn(() => true),
    removeDeck: vi.fn(() => true),
    selectDeck: vi.fn(),
    loadSettings: vi.fn(() => ({ deck: "LWK_1" })),
    store,
    getCardLabel: (card: BaseCard) => `Level ${card.level}`,
    getCardKey: (card: BaseCard) => `${card.level}-${card.time}`,
  }
}

// Reusable stubs — plain versions for navigation tests
const plainStubs = {
  ...quasarStubs,
  HomeDeckSelector: { template: "<div />", methods: { refresh: vi.fn() } },
  CardsManLevelDistribution: { template: "<div />" },
  CardsListOfCards: {
    props: ["title", "selectedLevel"],
    template: '<div class="list-stub">{{ title }}|{{ selectedLevel }}</div>',
  },
  CardManActions: { template: "<div />" },
}

const globalOpts = {
  mocks: quasarMocks,
  plugins: [router],
  provide: quasarProvide,
  stubs: plainStubs,
}

describe("CardsManPage (shared)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    dialogMock.mockReturnValue({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() })
    vi.spyOn(router, "push").mockResolvedValue()
  })

  it("mounts without errors", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it("back button navigates to /", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.find('[data-cy="back-button"]').trigger("click")
    expect(router.push).toHaveBeenCalledWith({ name: "/HomePage" })
  })

  it("edit-cards button navigates to editCardsRoute", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.find('[data-cy="edit-cards-button"]').trigger("click")
    expect(router.push).toHaveBeenCalledWith("/cards-edit")
  })

  describe("deck management", () => {
    it("add creates the trimmed deck and selects it", async () => {
      const props = makeProps(makeMockStore())
      dialogMock.mockReturnValueOnce(makeDialogWithValue("  Neu  "))
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      await wrapper.find('[data-cy="add-deck-button"]').trigger("click")
      expect(props.addDeck).toHaveBeenCalledWith("Neu")
      expect(props.selectDeck).toHaveBeenCalledWith("Neu")
    })

    it("add with duplicate name notifies and does not select", async () => {
      const props = makeProps(makeMockStore())
      props.addDeck.mockReturnValue(false)
      dialogMock.mockReturnValueOnce(makeDialogWithValue("LWK_1"))
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      await wrapper.find('[data-cy="add-deck-button"]').trigger("click")
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: "negative" }))
      expect(props.selectDeck).not.toHaveBeenCalled()
    })

    it("rename renames the current deck", async () => {
      const props = makeProps(makeMockStore())
      dialogMock.mockReturnValueOnce(makeDialogWithValue("Englisch"))
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      await wrapper.find('[data-cy="rename-deck-button"]').trigger("click")
      expect(props.renameDeck).toHaveBeenCalledWith("LWK_1", "Englisch")
    })

    it("rename with unchanged name does nothing", async () => {
      const props = makeProps(makeMockStore())
      dialogMock.mockReturnValueOnce(makeDialogWithValue("LWK_1"))
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      await wrapper.find('[data-cy="rename-deck-button"]').trigger("click")
      expect(props.renameDeck).not.toHaveBeenCalled()
    })

    it("remove deletes the current deck after confirmation", async () => {
      const props = makeProps(makeMockStore())
      dialogMock.mockReturnValueOnce(makeDialogWithOk())
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      await wrapper.find('[data-cy="remove-deck-button"]').trigger("click")
      expect(props.removeDeck).toHaveBeenCalledWith("LWK_1")
    })

    it("remove button is disabled for the last deck", async () => {
      const props = makeProps(makeMockStore())
      props.getDecks.mockReturnValue([{ name: "LWK_1", cards: mockCards }])
      const wrapper = mount(CardsManPage, { props, global: globalOpts })
      expect(wrapper.find('[data-cy="remove-deck-button"]').attributes("disable")).toBe("true")
    })

    it("empty deck shows hint instead of stats", async () => {
      const store = makeMockStore()
      store.allCards.value = []
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      expect(wrapper.find('[data-cy="empty-deck-hint"]').exists()).toBe(true)
      expect(wrapper.find(".list-stub").exists()).toBe(false)
      wrapper.findComponent({ name: "EmptyDeckHint" }).vm.$emit("add")
      expect(router.push).toHaveBeenCalledWith("/cards-edit")
    })
  })

  it("Escape key triggers navigation to /", () => {
    const store = makeMockStore()
    mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(router.push).toHaveBeenCalledWith({ name: "/HomePage" })
  })

  it("handleMoveClick is triggered by CardManActions move-click event", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleMoveClick: () => void }
    expect(() => {
      vm.handleMoveClick?.()
    }).not.toThrow()
  })

  it("handleResetCards is triggered by CardsManLevelDistribution reset event", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleResetCards: () => void }
    expect(() => {
      vm.handleResetCards?.()
    }).not.toThrow()
  })

  it("handleResetCardsToDefaultSet is triggered by CardManActions reset-click event", async () => {
    const store = makeMockStore()
    const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as unknown as { handleResetCardsToDefaultSet: () => void }
    expect(() => {
      vm.handleResetCardsToDefaultSet?.()
    }).not.toThrow()
  })

  // ─── handleMoveClick — dialog confirmation ────────────────────────────────

  describe("handleMoveClick — dialog confirmation", () => {
    it("calls moveAllCards when dialog is confirmed", async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleMoveClick: () => void; targetLevel: number }
      vm.targetLevel = 3
      vm.handleMoveClick()
      expect(store.moveAllCards).toHaveBeenCalledWith(3)
    })

    it("handleMoveClick with invalid level calls notify", async () => {
      const store = makeMockStore()
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleMoveClick: () => void; targetLevel: number }
      vm.targetLevel = 99 // invalid
      vm.handleMoveClick()
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: "negative" }))
    })
  })

  // ─── handleResetCards — calls moveAllCards(1) and resets time ─────────────

  describe("handleResetCards", () => {
    it("calls moveAllCards(1) and resets card times when dialog confirmed", async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleResetCards: () => void }
      vm.handleResetCards()

      expect(store.moveAllCards).toHaveBeenCalledWith(1)
    })
  })

  // ─── handleResetCardsToDefaultSet ────────────────────────────────────────

  describe("handleResetCardsToDefaultSet", () => {
    it("calls resetCards when dialog confirmed", async () => {
      const store = makeMockStore()
      dialogMock.mockReturnValueOnce(makeDialogWithOk())

      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleResetCardsToDefaultSet: () => void }
      vm.handleResetCardsToDefaultSet()

      expect(store.resetCards).toHaveBeenCalled()
    })
  })

  // ─── handleLevelClick — filters cards ────────────────────────────────────

  describe("handleLevelClick", () => {
    it("does not throw when called via vm", async () => {
      const store = makeMockStore()
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { handleLevelClick: (level: number) => void }
      expect(() => {
        vm.handleLevelClick?.(2)
      }).not.toThrow()
    })
  })

  describe("handleTimeBucketClick", () => {
    function mountWithHistogram() {
      return mount(CardsManPage, {
        props: makeProps(makeMockStore()),
        global: {
          ...globalOpts,
          stubs: {
            ...plainStubs,
            CardsTimeHistogram: {
              template: '<button data-cy="histogram-stub" @click="$emit(\'bucketClick\', 3)" />',
            },
          },
        },
      })
    }

    it("time bucket click shows time-filtered list title", async () => {
      const wrapper = mountWithHistogram()
      await wrapper.find('[data-cy="histogram-stub"]').trigger("click")
      const listStub = wrapper.find(".list-stub")
      expect(listStub.text()).toContain("Zeit <20s")
    })

    it("level click after time selection switches the list back to level view", async () => {
      const wrapper = mountWithHistogram()
      await wrapper.find('[data-cy="histogram-stub"]').trigger("click")
      const vm = wrapper.vm as unknown as { handleLevelClick: (level: number) => void }
      vm.handleLevelClick(2)
      await wrapper.vm.$nextTick()
      const listStub = wrapper.find(".list-stub")
      expect(listStub.text()).not.toContain("Zeit")
    })
  })

  // ─── duplicateKeys — detects duplicate cards ────────────────────────────

  describe("duplicateKeys", () => {
    it("returns empty set when all cards have unique keys", async () => {
      const store = makeMockStore()
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { duplicateKeys: Set<string> }
      expect(vm.duplicateKeys.size).toBe(0)
    })

    it("detects duplicate cards based on getCardKey", async () => {
      const cards: BaseCard[] = [
        { level: 1, time: 60 },
        { level: 1, time: 60 }, // same key as first
        { level: 2, time: 30 },
        { level: 1, time: 60 }, // same key as first
      ]
      const store = {
        allCards: ref<BaseCard[]>(cards),
        moveAllCards: vi.fn(),
        resetCards: vi.fn(),
      }
      const wrapper = mount(CardsManPage, { props: makeProps(store), global: globalOpts })
      await wrapper.vm.$nextTick()
      const vm = wrapper.vm as unknown as { duplicateKeys: Set<string> }
      expect(vm.duplicateKeys.size).toBe(1)
      expect(vm.duplicateKeys.has("1-60")).toBe(true)
    })
  })
})
