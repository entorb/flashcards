import { expect, test as it, type Page } from "@playwright/test"

async function createDeck(page: Page, name: string) {
  await page.getByTestId("add-deck-button").click()
  await page.getByTestId("deck-name-input").fill(name)
  await page.getByRole("button", { name: "OK" }).click()
}

it.describe("LWK Deck Management", () => {
  it.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
  })

  it("create a deck: asks for name, selects empty deck", async ({ page }) => {
    await createDeck(page, "Testkiste")
    await expect(page.getByTestId("deck-selector")).toContainText("Testkiste (0)")
    await expect(page.getByTestId("empty-deck-hint")).toBeVisible()

    // Empty-deck hint leads to card editing
    await page.getByTestId("empty-deck-add-cards").click()
    await expect(page).toHaveURL(/\/cards-edit/u)
  })

  it("cancel create keeps decks unchanged", async ({ page }) => {
    await page.getByTestId("add-deck-button").click()
    await page.keyboard.press("Escape")
    // Escape only closes the dialog, stays on cards page
    await expect(page).toHaveURL(/\/cards$/u)
    await expect(page.getByTestId("empty-deck-hint")).toHaveCount(0)
  })

  it("rename the current deck", async ({ page }) => {
    await createDeck(page, "Testkiste")
    await page.getByTestId("rename-deck-button").click()
    await expect(page.getByTestId("deck-name-input")).toHaveValue("Testkiste")
    await page.getByTestId("deck-name-input").fill("Umbenannt")
    await page.getByRole("button", { name: "OK" }).click()
    await expect(page.getByTestId("deck-selector")).toContainText("Umbenannt")
  })

  it("delete the current deck", async ({ page }) => {
    await createDeck(page, "Testkiste")
    await page.getByTestId("remove-deck-button").click()
    await page.getByRole("button", { name: "OK" }).click()
    await expect(page.getByTestId("deck-selector")).not.toContainText("Testkiste")
    await expect(page.getByTestId("empty-deck-hint")).toHaveCount(0)
  })

  it("created deck persists after reload and shows hint on home page", async ({ page }) => {
    await createDeck(page, "Testkiste")
    await page.reload()
    await expect(page.getByTestId("deck-selector")).toContainText("Testkiste")

    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("empty-deck-hint")).toBeVisible()
  })
})
