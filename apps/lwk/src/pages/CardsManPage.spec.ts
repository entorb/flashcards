import type { BaseCard } from "@flashcards/shared"
import { quasarMocks, quasarProvide, quasarStubs } from "@flashcards/shared/test-utils"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import CardsManPage from "./CardsManPage.vue"

// ---------------------------------------------------------------------------
// Stub the shared CardsManPage component
// ---------------------------------------------------------------------------

const { SharedCardsManPageStub } = vi.hoisted(() => ({
  SharedCardsManPageStub: {
    name: "CardsManPage",
    template: `<div data-cy="shared-cards-man-page">
      <button data-cy="back-button" @click="$emit('back')" />
      <button data-cy="edit-cards-button" @click="$emit('editCards')" />
    </div>`,
    props: [
      "appPrefix",
      "title",
      "bannerHtml",
      "decksTitle",
      "editCardsRoute",
      "getDecks",
      "addDeck",
      "renameDeck",
      "removeDeck",
      "selectDeck",
      "loadSettings",
      "store",
      "getCardLabel",
      "getCardKey",
    ],
    emits: ["back", "editCards"],
  },
}))

vi.mock("@flashcards/shared/components", () => ({
  CardsManPage: SharedCardsManPageStub,
}))

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

const mockAllCards = ref<BaseCard[]>([{ level: 1, time: 60 }])
const mockMoveAllCards = vi.fn()
const mockResetCards = vi.fn()
const mockGetDecks = vi.fn(() => [{ name: "LWK_1", cards: mockAllCards.value }])
const mockSelectDeck = vi.fn()
const mockAddDeck = vi.fn(() => true)
const mockRenameDeck = vi.fn(() => true)
const mockRemoveDeck = vi.fn(() => true)

vi.mock("@/composables/useGameStore", () => ({
  useGameStore: vi.fn(() => ({
    allCards: mockAllCards,
    moveAllCards: mockMoveAllCards,
    resetCards: mockResetCards,
    getDecks: mockGetDecks,
    selectDeck: mockSelectDeck,
    addDeck: mockAddDeck,
    renameDeck: mockRenameDeck,
    removeDeck: mockRemoveDeck,
  })),
}))

vi.mock("@/services/storage", () => ({
  loadSettings: vi.fn(() => null),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("lwk CardsManPage", () => {
  const createMockRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "/HomePage", component: { template: "<div />" } },
        { path: "/cards", name: "/CardsManPage", component: { template: "<div />" } },
        { path: "/cards-edit", name: "/CardsEditPage", component: { template: "<div />" } },
      ],
    })

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: { ...quasarStubs },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockAllCards.value = [{ level: 1, time: 60 }]
    mockGetDecks.mockReturnValue([{ name: "LWK_1", cards: mockAllCards.value }])
  })

  // ─── Mounting ─────────────────────────────────────────────────────────────

  describe("mounting", () => {
    it("mounts without errors", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })

    it("renders the shared CardsManPage component", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-cy="shared-cards-man-page"]').exists()).toBe(true)
    })
  })

  // ─── Props ────────────────────────────────────────────────────────────────

  describe("props passed to shared CardsManPage", () => {
    it('passes appPrefix="lwk"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props("appPrefix")).toBe("lwk")
    })

    it('passes editCardsRoute="/cards-edit"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props("editCardsRoute")).toBe("/cards-edit")
    })

    it("passes store with allCards, moveAllCards, resetCards", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const store = shared.props("store") as {
        allCards: typeof mockAllCards
        moveAllCards: typeof mockMoveAllCards
        resetCards: typeof mockResetCards
      }
      expect(store.allCards).toBe(mockAllCards)
      expect(typeof store.moveAllCards).toBe("function")
      expect(typeof store.resetCards).toBe("function")
    })

    it("passes getDecks function that returns decks", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getDecks = shared.props("getDecks") as () => { name: string }[]
      expect(typeof getDecks).toBe("function")
      expect(getDecks()[0]!.name).toBe("LWK_1")
    })

    it("passes deck functions that delegate to store", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      ;(shared.props("selectDeck") as (name: string) => void)("LWK_2")
      expect(mockSelectDeck).toHaveBeenCalledWith("LWK_2")
      ;(shared.props("addDeck") as (name: string) => boolean)("neu")
      expect(mockAddDeck).toHaveBeenCalledWith("neu")
      ;(shared.props("renameDeck") as (a: string, b: string) => boolean)("LWK_2", "neu")
      expect(mockRenameDeck).toHaveBeenCalledWith("LWK_2", "neu")
      ;(shared.props("removeDeck") as (name: string) => boolean)("LWK_2")
      expect(mockRemoveDeck).toHaveBeenCalledWith("LWK_2")
    })

    it("passes loadSettings function", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props("loadSettings")).toBe("function")
    })

    it("passes getCardLabel function", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props("getCardLabel")).toBe("function")
    })

    it("passes getCardKey function", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(typeof shared.props("getCardKey")).toBe("function")
    })
  })

  // ─── getCardLabel (lwk-specific) ──────────────────────────────────────────

  describe("getCardLabel (lwk-specific)", () => {
    it("returns the word field as label", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardLabel = shared.props("getCardLabel") as (card: BaseCard) => string
      const card = { word: "Jahr", level: 1, time: 60 } as unknown as BaseCard
      expect(getCardLabel(card)).toBe("Jahr")
    })
  })

  // ─── getCardKey (lwk-specific) ────────────────────────────────────────────

  describe("getCardKey (lwk-specific)", () => {
    it("returns the word field as key", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardKey = shared.props("getCardKey") as (card: BaseCard) => string
      const card = { word: "bleiben", level: 2, time: 45 } as unknown as BaseCard
      expect(getCardKey(card)).toBe("bleiben")
    })
  })
})
