import type { BaseCard } from "@flashcards/shared"
import { quasarMocks, quasarProvide, quasarStubs } from "@flashcards/shared/test-utils"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import CardsManPage from "./CardsManPage.vue"

// Stub the shared CardsManPage so we can inspect props without running its full logic.
// The stub key must match the local import alias used in the template: `CardsManPage`
// (imported as `import { CardsManPage } from '@flashcards/shared/components'`).
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

// Mock store
const mockAllCards = ref<BaseCard[]>([{ level: 1, time: 60 }])
const mockMoveAllCards = vi.fn()
const mockResetCards = vi.fn()
const mockGetDecks = vi.fn(() => [{ name: "en", cards: mockAllCards.value }])
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

describe("voc CardsManPage", () => {
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
  })

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

  describe("props passed to shared CardsManPage", () => {
    it('passes appPrefix="voc"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      expect(shared.props("appPrefix")).toBe("voc")
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

    it("passes getDecks function from store", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getDecks = shared.props("getDecks") as () => { name: string; cards: BaseCard[] }[]
      expect(typeof getDecks).toBe("function")
      const result = getDecks()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe("en")
    })

    it("passes deck functions that delegate to store", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      ;(shared.props("selectDeck") as (name: string) => void)("fr")
      expect(mockSelectDeck).toHaveBeenCalledWith("fr")
      ;(shared.props("addDeck") as (name: string) => boolean)("neu")
      expect(mockAddDeck).toHaveBeenCalledWith("neu")
      ;(shared.props("renameDeck") as (a: string, b: string) => boolean)("fr", "neu")
      expect(mockRenameDeck).toHaveBeenCalledWith("fr", "neu")
      ;(shared.props("removeDeck") as (name: string) => boolean)("fr")
      expect(mockRemoveDeck).toHaveBeenCalledWith("fr")
    })

    it("passes loadSettings from storage", async () => {
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

  describe("getCardLabel (voc-specific)", () => {
    it('formats label as "voc → de"', async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardLabel = shared.props("getCardLabel") as (card: BaseCard) => string
      const card = { voc: "hello", de: "hallo", level: 1, time: 60 } as unknown as BaseCard
      expect(getCardLabel(card)).toBe("hello → hallo")
    })

    it("handles cards with different voc/de values", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardLabel = shared.props("getCardLabel") as (card: BaseCard) => string
      const card = { voc: "cat", de: "Katze", level: 3, time: 30 } as unknown as BaseCard
      expect(getCardLabel(card)).toBe("cat → Katze")
    })
  })

  describe("getCardKey (voc-specific)", () => {
    it("returns the voc field as key", async () => {
      const router = createMockRouter()
      const wrapper = mount(CardsManPage, createMountOptions(router))
      await wrapper.vm.$nextTick()
      const shared = wrapper.findComponent(SharedCardsManPageStub)
      const getCardKey = shared.props("getCardKey") as (card: BaseCard) => string
      const card = { voc: "hello", de: "hallo", level: 1, time: 60 } as unknown as BaseCard
      expect(getCardKey(card)).toBe("hello")
    })
  })
})
